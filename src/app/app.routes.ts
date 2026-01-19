import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { ChatComponent } from './features/chat/chat.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'chat',
    component: ChatComponent,
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: '/chat',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/chat'
  }
];
