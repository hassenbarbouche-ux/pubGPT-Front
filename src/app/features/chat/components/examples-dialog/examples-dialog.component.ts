import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ExampleQuestion {
  question: string;
  intention: 'Requetage donnee' | 'Business Intelligence' | 'Question metier' | 'Hors sujet';
  complexite: 'Facile' | 'Moyen' | 'Difficile';
  crossMetier: boolean;
  domaines: string[];
  charts: boolean;
}

@Component({
  selector: 'app-examples-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './examples-dialog.component.html',
  styleUrls: ['./examples-dialog.component.scss']
})
export class ExamplesDialogComponent {
  selectedQuestion: ExampleQuestion | null = null;

  questions: ExampleQuestion[] = [
    { question: 'Donne moi les briefs Peugeot de 2025 avec leurs spots et leurs tarifs', intention: 'Requetage donnee', complexite: 'Difficile', crossMetier: true, domaines: ['Planning', 'Inventaire'], charts: false },
    { question: 'Combien de campagnes ont \u00e9t\u00e9 diffus\u00e9es ce mois-ci ?', intention: 'Requetage donnee', complexite: 'Facile', crossMetier: false, domaines: ['Diffusion'], charts: true },
    { question: 'Quelles cha\u00eenes sont les plus utilis\u00e9es ?', intention: 'Requetage donnee', complexite: 'Facile', crossMetier: false, domaines: ['Diffusion'], charts: true },
    { question: 'Quel est le CA investi par Renault en 2024 ?', intention: 'Requetage donnee', complexite: 'Moyen', crossMetier: false, domaines: ['ADV'], charts: true },
    { question: 'Quels sont les spots les plus diffus\u00e9s cette semaine ?', intention: 'Requetage donnee', complexite: 'Moyen', crossMetier: false, domaines: ['Diffusion'], charts: false },
    { question: 'Donne moi la liste des annonceurs du secteur automobile', intention: 'Requetage donnee', complexite: 'Facile', crossMetier: false, domaines: ['ADV'], charts: false },
    { question: 'Quel est le top 10 des campagnes par budget ?', intention: 'Requetage donnee', complexite: 'Moyen', crossMetier: true, domaines: ['ADV', 'Planning'], charts: true },
    { question: 'Combien de spots ont \u00e9t\u00e9 diffus\u00e9s sur TF1 en janvier ?', intention: 'Requetage donnee', complexite: 'Facile', crossMetier: false, domaines: ['Diffusion'], charts: true },
    { question: 'Quelle est la r\u00e9partition des investissements par secteur ?', intention: 'Business Intelligence', complexite: 'Moyen', crossMetier: true, domaines: ['ADV', 'Diffusion'], charts: true },
    { question: 'Donne moi les GRP de la campagne Peugeot 208', intention: 'Requetage donnee', complexite: 'Moyen', crossMetier: false, domaines: ['Diffusion'], charts: false },
    { question: 'Quels sont les cr\u00e9neaux horaires les plus demand\u00e9s ?', intention: 'Business Intelligence', complexite: 'Moyen', crossMetier: false, domaines: ['Planning'], charts: true },
    { question: "Quel est le co\u00fbt moyen d'un spot sur M6 ?", intention: 'Requetage donnee', complexite: 'Facile', crossMetier: false, domaines: ['Inventaire'], charts: true },
    { question: "Combien d'annonceurs sont actifs ce trimestre ?", intention: 'Requetage donnee', complexite: 'Facile', crossMetier: false, domaines: ['ADV'], charts: true },
    { question: "Donne moi l'historique des tarifs de France 2", intention: 'Requetage donnee', complexite: 'Moyen', crossMetier: false, domaines: ['Inventaire'], charts: true },
    { question: 'Quelles sont les campagnes en cours cette semaine ?', intention: 'Requetage donnee', complexite: 'Facile', crossMetier: false, domaines: ['Diffusion'], charts: false },
    { question: 'Quel annonceur a le plus gros budget ce mois-ci ?', intention: 'Requetage donnee', complexite: 'Moyen', crossMetier: false, domaines: ['ADV'], charts: true },
    { question: 'Compare les investissements pub TV 2024 vs 2025', intention: 'Business Intelligence', complexite: 'Difficile', crossMetier: true, domaines: ['ADV', 'Diffusion'], charts: true },
    { question: "Qu'est-ce qu'un GRP ?", intention: 'Question metier', complexite: 'Facile', crossMetier: false, domaines: ['Diffusion'], charts: false },
    { question: 'Quel est le taux de remplissage publicitaire de TMC ?', intention: 'Business Intelligence', complexite: 'Difficile', crossMetier: false, domaines: ['Inventaire'], charts: true },
    { question: 'Raconte-moi une blague', intention: 'Hors sujet', complexite: 'Facile', crossMetier: false, domaines: [], charts: false }
  ];

  constructor(private dialogRef: MatDialogRef<ExamplesDialogComponent>) {}

  onSelect(q: ExampleQuestion): void {
    this.selectedQuestion = q;
  }

  onConfirm(): void {
    if (this.selectedQuestion) {
      this.dialogRef.close(this.selectedQuestion.question);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

}
