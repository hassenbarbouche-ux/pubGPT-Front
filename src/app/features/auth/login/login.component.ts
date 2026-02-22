import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest, DemoLoginRequest } from '../../../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  backgroundVideo = '/videos/video.mp4';

  // Standard login
  login = '';
  password = '';

  // Demo login
  demoEmail = '';
  demoCode = '';
  isDemoMode = false;

  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  switchMode(demo: boolean): void {
    this.isDemoMode = demo;
    this.errorMessage = '';
  }

  onSubmit(): void {
    if (!this.login.trim() || !this.password.trim()) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    const loginRequest: LoginRequest = {
      login: this.login.trim(),
      password: this.password.trim()
    };

    this.authService.login(loginRequest).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/chat']);
        } else {
          this.errorMessage = response.message || 'Identifiants incorrects';
          this.isLoading = false;
        }
      },
      error: () => {
        this.errorMessage = 'Une erreur est survenue lors de la connexion';
        this.isLoading = false;
      }
    });
  }

  onDemoSubmit(): void {
    if (!this.demoEmail.trim() || !this.demoCode.trim()) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    const request: DemoLoginRequest = {
      email: this.demoEmail.trim().toLowerCase(),
      code: this.demoCode.trim().toUpperCase()
    };

    this.authService.demoLogin(request).subscribe({
      next: (response) => {
        if (response.valid) {
          this.router.navigate(['/chat']);
        } else {
          this.errorMessage = response.error || 'Code invalide';
          this.isLoading = false;
        }
      },
      error: (err) => {
        if (err.error?.error) {
          this.errorMessage = err.error.error;
        } else {
          this.errorMessage = 'Erreur réseau. Veuillez réessayer.';
        }
        this.isLoading = false;
      }
    });
  }
}
