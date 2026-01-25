# Guide d'implémentation - Système de Clarification d'Ambiguïté

## ✅ Fichiers déjà créés

### 1. Modèles TypeScript
- ✅ `/src/app/core/models/ambiguity.model.ts` - Modèles pour clarification
  - `ClarificationQuestion` - Question avec choix
  - `AmbiguityResponse` - Réponse d'ambiguïté du backend
  - `ClarificationContext` - Contexte à renvoyer au backend
  - `ClarificationAnswer` - État UI temporaire

### 2. ChatResponse modifié
- ✅ `/src/app/core/models/chat-response.model.ts`
  - Ajout champ `ambiguityDetected?: AmbiguityResponse | null`

### 3. Composant Dialog
- ✅ `/src/app/features/chat/components/clarification-dialog/clarification-dialog.component.ts`
- ✅ `/src/app/features/chat/components/clarification-dialog/clarification-dialog.component.html`
- ✅ `/src/app/features/chat/components/clarification-dialog/clarification-dialog.component.scss`

---

## 🔧 Modifications à faire

### Étape 1 : Modifier ChatService

**Fichier:** `/src/app/core/services/chat.service.ts`

**Ajouter:**
```typescript
import { ClarificationContext } from '../models/ambiguity.model';

// Modifier la signature de streamChat pour accepter clarificationContext
streamChat(
  question: string,
  userId: number,
  sessionId?: string,
  isChartDemanded: boolean = false,
  clarificationContext?: ClarificationContext  // ← NOUVEAU
): Observable<StreamEvent> {
  const params: any = {
    question,
    userId: userId.toString(),
    isChartDemanded: isChartDemanded.toString()
  };

  if (sessionId) {
    params.sessionId = sessionId;
  }

  // ⚠️ PROBLÈME: GET ne peut pas envoyer clarificationContext facilement
  // SOLUTION: Créer une nouvelle méthode POST pour streaming avec clarifications
  // OU: Utiliser POST /api/v1/chat pour les cas avec clarifications

  // Pour l'instant, si clarificationContext est fourni, utiliser POST /api/v1/chat
  if (clarificationContext) {
    return this.streamChatWithClarification(
      question,
      userId,
      sessionId,
      isChartDemanded,
      clarificationContext
    );
  }

  // Sinon, utiliser GET /stream comme avant
  const url = `${environment.apiUrl}/chat/stream?${new URLSearchParams(params).toString()}`;
  // ... reste du code inchangé
}

/**
 * Nouvelle méthode: Stream chat avec clarificationContext via POST
 * Utilise POST /api/v1/chat au lieu de GET /stream
 */
private streamChatWithClarification(
  question: string,
  userId: number,
  sessionId?: string,
  isChartDemanded: boolean = false,
  clarificationContext?: ClarificationContext
): Observable<StreamEvent> {
  const body = {
    question,
    userId,
    sessionId,
    isChartDemanded,
    clarificationContext  // ← Inclure dans le body
  };

  // Utiliser HttpClient.post avec response type 'text' pour SSE
  // ⚠️ NOTE: Angular HttpClient ne supporte pas nativement SSE avec POST
  // SOLUTION ALTERNATIVE: Utiliser fetch() ou EventSource polyfill

  // Pour simplifier: faire un appel POST normal (non-streaming) avec clarificationContext
  return this.http.post<ChatResponse>(`${environment.apiUrl}/chat`, body).pipe(
    map(response => {
      // Convertir ChatResponse en StreamEvent pour compatibilité
      return {
        step: 'result',
        message: 'Réponse reçue',
        data: response,
        timestamp: new Date().toISOString()
      } as StreamEvent;
    })
  );
}
```

**⚠️ ALTERNATIVE RECOMMANDÉE:**

Pour les cas avec `clarificationContext`, utiliser directement POST `/api/v1/chat` (appel non-streaming) :

```typescript
/**
 * Envoyer une question avec clarificationContext (appel POST non-streaming)
 */
sendMessageWithClarification(
  question: string,
  userId: number,
  clarificationContext: ClarificationContext,
  sessionId?: string,
  isChartDemanded: boolean = false
): Observable<ChatResponse> {
  const body = {
    question,
    userId,
    sessionId,
    isChartDemanded,
    clarificationContext
  };

  return this.http.post<ChatResponse>(`${environment.apiUrl}/chat`, body);
}
```

---

### Étape 2 : Modifier ChatComponent

**Fichier:** `/src/app/features/chat/chat.component.ts`

**1. Ajouter les imports:**

```typescript
import { MatDialog } from '@angular/material/dialog';
import {
  ClarificationDialogComponent,
  ClarificationDialogData
} from './components/clarification-dialog/clarification-dialog.component';
import { ClarificationContext } from '../../core/models/ambiguity.model';
```

**2. Injecter MatDialog dans le constructeur:**

```typescript
constructor(
  private chatService: ChatService,
  private conversationService: ConversationService,
  private authService: AuthService,
  private dialog: MatDialog  // ← AJOUTER
) {}
```

**3. Modifier `handleStreamEvent()` pour détecter l'ambiguïté:**

```typescript
private handleStreamEvent(event: StreamEvent, message: ChatMessage): void {
  // ... code existant ...

  // Événement 'result' - Réponse finale
  if (event.step === 'result' && event.data) {
    const response: ChatResponse = event.data;

    // ⚠️ NOUVEAU: Vérifier si ambiguïté détectée
    if (response.ambiguityDetected?.hasAmbiguity) {
      console.log('🔍 Ambiguïté détectée:', response.ambiguityDetected);

      // Ouvrir le dialog de clarification
      this.openClarificationDialog(
        response.ambiguityDetected,
        message.content  // Question originale
      );

      // Ne pas afficher le message dans la liste (pas de réponse encore)
      this.isProcessing = false;
      return;
    }

    // Sinon: traiter la réponse normale
    message.response = response;
    message.isStreaming = false;
    this.isProcessing = false;

    // ... reste du code existant ...
  }
}
```

**4. Ajouter la méthode `openClarificationDialog()`:**

```typescript
/**
 * Ouvre le dialog de clarification et gère la réponse utilisateur.
 */
private openClarificationDialog(
  ambiguityResponse: AmbiguityResponse,
  originalQuestion: string
): void {
  const dialogRef = this.dialog.open(ClarificationDialogComponent, {
    data: {
      questions: ambiguityResponse.questions
    } as ClarificationDialogData,
    width: '600px',
    disableClose: true,  // Empêcher fermeture en cliquant à l'extérieur
    autoFocus: true
  });

  dialogRef.afterClosed().subscribe((clarificationContext: ClarificationContext | null) => {
    if (clarificationContext) {
      // User a confirmé → Relancer la requête avec le contexte
      console.log('✅ Clarifications reçues:', clarificationContext);
      this.resendMessageWithClarification(originalQuestion, clarificationContext);
    } else {
      // User a annulé → Réinitialiser l'état
      console.log('❌ Clarification annulée');
      this.isProcessing = false;
    }
  });
}
```

**5. Ajouter la méthode `resendMessageWithClarification()`:**

```typescript
/**
 * Renvoie la question originale avec le contexte de clarification.
 */
private resendMessageWithClarification(
  question: string,
  clarificationContext: ClarificationContext
): void {
  this.isProcessing = true;

  // Créer un nouveau message utilisateur (optionnel: peut réutiliser l'ancien)
  const userMessage: ChatMessage = {
    id: this.generateMessageId(),
    role: 'user',
    content: question,
    timestamp: new Date()
  };

  // Créer le message assistant pour le streaming
  const assistantMessage: ChatMessage = {
    id: this.generateMessageId(),
    role: 'assistant',
    content: '',
    timestamp: new Date(),
    isStreaming: true,
    streamingSteps: [],
    checklistState: new Map()
  };

  this.messages.push(assistantMessage);

  const userId = this.authService.getUserId();
  if (!userId) {
    console.error('❌ User ID manquant');
    this.isProcessing = false;
    return;
  }

  // Utiliser la nouvelle méthode avec clarificationContext
  this.chatService.sendMessageWithClarification(
    question,
    userId,
    clarificationContext,
    this.sessionId,
    false  // isChartDemanded - ajuster selon le besoin
  ).subscribe({
    next: (response: ChatResponse) => {
      console.log('✅ Réponse avec clarifications:', response);

      // Vérifier à nouveau l'ambiguïté (cas d'ambiguïté persistante)
      if (response.ambiguityDetected?.hasAmbiguity) {
        console.error('⚠️ Ambiguïté persistante malgré clarifications');

        // Afficher message d'erreur à l'utilisateur
        assistantMessage.content = response.answer ||
          "Désolé, je n'ai pas pu générer une requête précise malgré vos clarifications.";
        assistantMessage.isStreaming = false;
        this.isProcessing = false;
        return;
      }

      // Traiter la réponse normale
      assistantMessage.response = response;
      assistantMessage.content = response.answer;
      assistantMessage.isStreaming = false;

      // Mettre à jour la session
      if (response.sessionId) {
        this.sessionId = response.sessionId;
      }

      this.isProcessing = false;
    },
    error: (error) => {
      console.error('❌ Erreur lors de l\'envoi avec clarifications:', error);
      assistantMessage.content = 'Une erreur est survenue lors du traitement de votre demande.';
      assistantMessage.isStreaming = false;
      this.isProcessing = false;
    }
  });
}
```

---

### Étape 3 : Mettre à jour les imports dans chat.component.ts

**Ajouter dans les imports du component:**

```typescript
import { MatDialogModule } from '@angular/material/dialog';
```

**Dans le decorator @Component, ajouter dans `imports`:**

```typescript
@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    // ... autres imports existants
    MatDialogModule,  // ← AJOUTER
    ClarificationDialogComponent  // ← AJOUTER
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
```

---

## 🎯 Workflow complet

### Cas 1: Question sans ambiguïté (fonctionnement normal)
```
1. User tape question → onSendMessage()
2. ChatService.streamChat() → GET /stream
3. Événements SSE reçus
4. Réponse finale: response.ambiguityDetected = null
5. Affichage normal (answer, SQL, tableau, graphique)
```

### Cas 2: Question avec ambiguïté
```
1. User tape question → onSendMessage()
2. ChatService.streamChat() → GET /stream
3. Backend détecte ambiguïté
4. Événement SSE 'ambiguity_detected' reçu
5. handleStreamEvent() détecte response.ambiguityDetected != null
6. openClarificationDialog() ouvre popup stepper
7. User répond aux questions
8. User clique "Confirmer"
9. resendMessageWithClarification() appelé
10. ChatService.sendMessageWithClarification() → POST /api/v1/chat
11. Backend génère SQL avec clarifications
12. Réponse finale affichée
```

### Cas 3: Ambiguïté persistante (edge case)
```
... Même workflow que Cas 2, jusqu'à l'étape 11
11. Backend détecte encore une ambiguïté
12. response.ambiguityDetected != null
13. Affichage message d'erreur gracieux
14. Invite user à reformuler sa question
```

---

## 📝 Checklist d'implémentation

- [x] Créer modèles TypeScript (ambiguity.model.ts)
- [x] Modifier ChatResponse (chat-response.model.ts)
- [x] Créer ClarificationDialogComponent (TS + HTML + SCSS)
- [ ] Modifier ChatService
  - [ ] Ajouter méthode `sendMessageWithClarification()`
  - [ ] (Optionnel) Modifier `streamChat()` pour support clarificationContext
- [ ] Modifier ChatComponent
  - [ ] Injecter MatDialog
  - [ ] Modifier `handleStreamEvent()` pour détecter ambiguïté
  - [ ] Ajouter `openClarificationDialog()`
  - [ ] Ajouter `resendMessageWithClarification()`
  - [ ] Ajouter imports (MatDialogModule, ClarificationDialogComponent)
- [ ] Tester le flux complet
  - [ ] Question simple → réponse normale
  - [ ] Question ambiguë → popup → clarifications → réponse
  - [ ] Ambiguïté persistante → message d'erreur
  - [ ] Annulation du dialog → retour état initial

---

## 🚀 Prochaines étapes

1. **Implémenter les modifications du ChatService** (voir Étape 1)
2. **Implémenter les modifications du ChatComponent** (voir Étape 2)
3. **Tester avec le backend** qui est déjà prêt
4. **Ajuster le styling** si nécessaire

---

## ⚠️ Notes importantes

### Limitation actuelle: GET /stream ne supporte pas clarificationContext

Le endpoint actuel `GET /api/v1/chat/stream` ne peut pas recevoir `clarificationContext` car il utilise des query params.

**Solutions:**
1. **Utilisée dans ce guide:** POST `/api/v1/chat` pour les cas avec clarifications (appel non-streaming)
2. **Alternative future:** Créer un endpoint POST `/api/v1/chat/stream` qui supporte body JSON + SSE

### Backend déjà prêt

Le backend Java Spring Boot est **100% opérationnel** pour gérer les clarifications:
- ✅ Détection d'ambiguïté
- ✅ Retour questions JSON
- ✅ Réception clarificationContext
- ✅ Génération SQL avec clarifications
- ✅ Gestion ambiguïté persistante

### Styling

Le dialog utilise Angular Material Design et les variables CSS globales de l'application:
- `--text-primary`
- `--text-secondary`
- `--border-color`
- Material Blue (#1976d2) pour les accents

---

## 📞 Support

Si vous avez des questions lors de l'implémentation, référez-vous à:
- **Backend:** `/Users/hassenbarbouche/pubGPT/src/main/java/com/pubgpt/`
- **Frontend:** `/Users/hassenbarbouche/pubgpt-frontend/src/app/`
- **Plan initial:** `/Users/hassenbarbouche/.claude/plans/ethereal-stargazing-kernighan.md`
