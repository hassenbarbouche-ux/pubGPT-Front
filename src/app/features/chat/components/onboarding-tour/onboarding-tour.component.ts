import { Component, Output, EventEmitter, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface TourStep {
  selector: string | null;
  title: string;
  description: string;
  animation: string;
  position: 'center' | 'right' | 'bottom' | 'top' | 'left';
}

@Component({
  selector: 'app-onboarding-tour',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding-tour.component.html',
  styleUrl: './onboarding-tour.component.scss'
})
export class OnboardingTourComponent {
  @Output() tourCompleted = new EventEmitter<void>();

  isActive = false;
  currentStep = 0;
  highlightStyle: Record<string, string> = {};
  popupStyle: Record<string, string> = {};
  animationHtml: SafeHtml = '';
  animationKey = 0;

  steps: TourStep[] = [
    {
      selector: null,
      title: 'Bienvenue sur pubGPT',
      description: 'Votre assistant intelligent pour l\'analyse media TV. Posez vos questions en langage naturel et obtenez instantanement des tableaux de donnees, graphiques interactifs et explications detaillees. Decouvrez les fonctionnalites cles en quelques etapes.',
      animation: `<div class="anim-welcome">
        <div class="anim-welcome-rings">
          <div class="anim-ring r1"></div>
          <div class="anim-ring r2"></div>
          <div class="anim-ring r3"></div>
        </div>
        <svg viewBox="0 0 120 40" class="anim-logo">
          <text x="10" y="30" font-family="sans-serif" font-size="24" font-weight="700" fill="#fff" class="anim-logo-pub">pub</text>
          <text x="62" y="30" font-family="sans-serif" font-size="24" font-weight="700" fill="#fff" class="anim-logo-gpt">GPT</text>
        </svg>
        <div class="anim-welcome-tagline">AI-Powered Media Analytics</div>
      </div>`,
      position: 'center'
    },
    {
      selector: '.drawer',
      title: 'Historique & Projets',
      description: 'Retrouvez toutes vos conversations passees et organisez-les par projet. Creez un nouveau chat a tout moment.',
      animation: `<div class="anim-history">
        <div class="anim-hist-folder">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
        </div>
        <div class="anim-hist-lines">
          <div class="anim-hist-line l1"></div>
          <div class="anim-hist-line l2"></div>
          <div class="anim-hist-line l3"></div>
        </div>
      </div>`,
      position: 'right'
    },
    {
      selector: '.token-usage-section',
      title: 'Suivi des tokens',
      description: 'Suivez votre consommation en temps reel. La barre change de couleur selon votre usage.',
      animation: `<div class="anim-tokens">
        <div class="anim-token-bar-bg">
          <div class="anim-token-bar-fill"></div>
        </div>
        <div class="anim-token-labels">
          <span>0%</span><span>50%</span><span>100%</span>
        </div>
      </div>`,
      position: 'right'
    },
    {
      selector: '.input-bar-wrapper',
      title: 'Posez votre question',
      description: 'Tapez votre question en langage naturel. pubGPT la convertit automatiquement en requete SQL.',
      animation: `<div class="anim-typing">
        <div class="anim-typing-box">
          <span class="anim-typing-text">Quel est le CA de Peugeot ?</span>
          <span class="anim-typing-cursor">|</span>
        </div>
      </div>`,
      position: 'top'
    },
    {
      selector: '.column-selector-button',
      title: 'Choix des colonnes',
      description: 'Selectionnez les colonnes que vous souhaitez voir dans les resultats de votre requete.',
      animation: `<div class="anim-columns">
        <div class="anim-col c1"><span class="anim-col-check">&#10003;</span> Annonceur</div>
        <div class="anim-col c2"><span class="anim-col-check">&#10003;</span> Produit</div>
        <div class="anim-col c3"><span class="anim-col-check">&#10003;</span> CA</div>
      </div>`,
      position: 'top'
    },
    {
      selector: '.chart-checkbox-wrapper:first-of-type',
      title: 'Explication detaillee',
      description: 'Cochez cette option pour recevoir une explication en langage naturel accompagnant les resultats.',
      animation: `<div class="anim-explain">
        <div class="anim-expl-line el1"></div>
        <div class="anim-expl-line el2"></div>
        <div class="anim-expl-line el3"></div>
        <div class="anim-expl-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>
        </div>
      </div>`,
      position: 'top'
    },
    {
      selector: '.chart-checkbox-wrapper:last-of-type',
      title: 'Visualisation graphique',
      description: 'Activez la generation automatique de graphiques interactifs a partir de vos donnees.',
      animation: `<div class="anim-chart">
        <div class="anim-bar b1"></div>
        <div class="anim-bar b2"></div>
        <div class="anim-bar b3"></div>
        <div class="anim-bar b4"></div>
        <div class="anim-bar b5"></div>
      </div>`,
      position: 'top'
    },
    {
      selector: '.header-right',
      title: 'Resultats & Metriques',
      description: 'Consultez la requete SQL generee, le score de confiance et le temps d\'execution apres chaque question.',
      animation: `<div class="anim-metrics">
        <div class="anim-badge ab1">SQL</div>
        <div class="anim-badge ab2">Accuracy</div>
        <div class="anim-badge ab3">Temps</div>
      </div>`,
      position: 'bottom'
    },
    {
      selector: null,
      title: 'Pret a explorer !',
      description: 'Vous avez 10 questions pour decouvrir la puissance de pubGPT. Posez votre premiere question !',
      animation: `<div class="anim-ready">
        <svg viewBox="0 0 60 60" class="anim-checkmark">
          <circle cx="30" cy="30" r="26" fill="none" stroke="#fff" stroke-width="2" class="anim-check-circle"/>
          <polyline points="18 30 27 39 42 22" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="anim-check-tick"/>
        </svg>
      </div>`,
      position: 'center'
    }
  ];

  constructor(private sanitizer: DomSanitizer) {}

  get currentStepData(): TourStep {
    return this.steps[this.currentStep];
  }

  get isLastStep(): boolean {
    return this.currentStep === this.steps.length - 1;
  }

  start(): void {
    this.currentStep = 0;
    this.isActive = true;
    this.updateStep();
  }

  next(): void {
    if (this.isLastStep) {
      this.complete();
      return;
    }
    this.currentStep++;
    this.updateStep();
  }

  skip(): void {
    this.complete();
  }

  private complete(): void {
    this.isActive = false;
    this.tourCompleted.emit();
  }

  private updateStep(): void {
    const step = this.currentStepData;
    this.animationKey++;
    this.animationHtml = this.sanitizer.bypassSecurityTrustHtml(step.animation);

    if (!step.selector) {
      this.highlightStyle = {
        display: 'block',
        top: '50%',
        left: '50%',
        width: '0px',
        height: '0px'
      };
      this.popupStyle = {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
      return;
    }

    const el = document.querySelector(step.selector) as HTMLElement;
    if (!el) {
      this.highlightStyle = {
        display: 'block',
        top: '50%',
        left: '50%',
        width: '0px',
        height: '0px'
      };
      this.popupStyle = {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
      return;
    }

    const rect = el.getBoundingClientRect();
    const pad = 8;

    this.highlightStyle = {
      display: 'block',
      top: (rect.top - pad) + 'px',
      left: (rect.left - pad) + 'px',
      width: (rect.width + pad * 2) + 'px',
      height: (rect.height + pad * 2) + 'px'
    };

    const popupW = 360;
    const popupH = 380;

    switch (step.position) {
      case 'right':
        this.popupStyle = {
          top: rect.top + 'px',
          left: (rect.right + 20) + 'px',
          transform: 'none'
        };
        break;
      case 'left':
        this.popupStyle = {
          top: rect.top + 'px',
          left: (rect.left - popupW - 20) + 'px',
          transform: 'none'
        };
        break;
      case 'bottom':
        this.popupStyle = {
          top: (rect.bottom + 16) + 'px',
          left: Math.max(16, rect.left + rect.width / 2 - popupW / 2) + 'px',
          transform: 'none'
        };
        break;
      case 'top':
        this.popupStyle = {
          top: (rect.top - popupH - 16) + 'px',
          left: Math.max(16, rect.left + rect.width / 2 - popupW / 2) + 'px',
          transform: 'none'
        };
        break;
      default:
        this.popupStyle = {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        };
    }

    // Clamp popup to viewport bounds
    const topVal = parseInt(this.popupStyle['top']);
    if (!isNaN(topVal)) {
      const vh = window.innerHeight;
      const clamped = Math.max(16, Math.min(topVal, vh - popupH - 16));
      this.popupStyle['top'] = clamped + 'px';
    }
  }
}
