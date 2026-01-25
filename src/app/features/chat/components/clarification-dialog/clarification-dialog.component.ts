import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatStepperModule } from '@angular/material/stepper';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ClarificationQuestion, ClarificationAnswer, ClarificationContext } from '../../../../core/models/ambiguity.model';

/**
 * Données passées au dialog lors de l'ouverture.
 */
export interface ClarificationDialogData {
  /** Liste des questions de clarification à afficher */
  questions: ClarificationQuestion[];
}

/**
 * Composant de dialog pour afficher les questions de clarification avec un stepper.
 * Utilisé quand le SqlGeneratorAgent détecte une ambiguïté dans la question utilisateur.
 *
 * Workflow:
 * 1. Affiche les questions une par une dans un stepper Material
 * 2. Pour chaque question, affiche les choix proposés + option "Autre"
 * 3. Collecte les réponses de l'utilisateur
 * 4. Retourne un ClarificationContext au ChatComponent
 */
@Component({
  selector: 'app-clarification-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatStepperModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './clarification-dialog.component.html',
  styleUrls: ['./clarification-dialog.component.scss']
})
export class ClarificationDialogComponent implements OnInit {
  /** État des réponses pour chaque question */
  answers: ClarificationAnswer[] = [];

  /** Index de la question courante dans le stepper */
  currentStepIndex: number = 0;

  constructor(
    public dialogRef: MatDialogRef<ClarificationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ClarificationDialogData
  ) {}

  ngOnInit(): void {
    // Initialiser les réponses pour chaque question
    this.answers = this.data.questions.map(q => ({
      question: q.question,
      selectedChoice: null,
      customAnswer: ''
    }));
  }

  /**
   * Vérifie si la question courante a une réponse valide.
   */
  isCurrentStepValid(): boolean {
    const currentAnswer = this.answers[this.currentStepIndex];
    if (!currentAnswer) return false;

    // Si un choix prédéfini est sélectionné
    if (currentAnswer.selectedChoice !== null && currentAnswer.selectedChoice !== 'Autre') {
      return true;
    }

    // Si "Autre" est sélectionné, vérifier que le champ texte n'est pas vide
    if (currentAnswer.selectedChoice === 'Autre') {
      return currentAnswer.customAnswer.trim().length > 0;
    }

    return false;
  }

  /**
   * Vérifie si toutes les questions ont été répondues.
   */
  areAllQuestionsAnswered(): boolean {
    return this.answers.every((answer, index) => {
      // Si un choix prédéfini est sélectionné
      if (answer.selectedChoice !== null && answer.selectedChoice !== 'Autre') {
        return true;
      }

      // Si "Autre" est sélectionné, vérifier que le champ texte n'est pas vide
      if (answer.selectedChoice === 'Autre') {
        return answer.customAnswer.trim().length > 0;
      }

      return false;
    });
  }

  /**
   * Gestion du changement de sélection radio.
   * Réinitialise le champ "Autre" si un choix prédéfini est sélectionné.
   */
  onChoiceChange(stepIndex: number, choice: string): void {
    const answer = this.answers[stepIndex];
    answer.selectedChoice = choice;

    // Réinitialiser le champ custom si un choix prédéfini est sélectionné
    if (choice !== 'Autre') {
      answer.customAnswer = '';
    }
  }

  /**
   * Annuler et fermer le dialog sans retourner de données.
   */
  onCancel(): void {
    this.dialogRef.close(null);
  }

  /**
   * Confirmer et retourner le contexte de clarification au composant parent.
   */
  onConfirm(): void {
    if (!this.areAllQuestionsAnswered()) {
      return;
    }

    // Construire le ClarificationContext à partir des réponses
    const userAnswers: Record<string, string> = {};

    this.answers.forEach((answer, index) => {
      const question = this.data.questions[index].question;

      if (answer.selectedChoice === 'Autre') {
        // Réponse personnalisée avec préfixe "Autre: "
        userAnswers[question] = `Autre: ${answer.customAnswer.trim()}`;
      } else if (answer.selectedChoice !== null) {
        // Choix prédéfini
        userAnswers[question] = answer.selectedChoice;
      }
    });

    const clarificationContext: ClarificationContext = {
      userAnswers
    };

    // Fermer le dialog et retourner le contexte
    this.dialogRef.close(clarificationContext);
  }
}
