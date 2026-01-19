import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  backgroundVideo = 'assets/videos/background.mp4';

  login = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

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
          // Rediriger vers la page de chat
          this.router.navigate(['/chat']);
        } else {
          this.errorMessage = response.message || 'Identifiants incorrects';
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Erreur de connexion:', error);
        this.errorMessage = 'Une erreur est survenue lors de la connexion';
        this.isLoading = false;
      }
    });
  }
}
