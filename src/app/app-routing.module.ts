import { AnswerResultComponent } from './game/view/answer-result/answer-result.component';
import { GameComponent } from './game/view/game/game.component';
import { RoomSelectorComponent } from './pages/room-selector/room-selector.component';
import { HomeComponent } from './pages/home/home.component';
import { RegisterComponent } from './pages/register/register.component';
import { LoginComponent } from './pages/login/login.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { ProfileComponent } from './pages/profile/profile.conmponent';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {//主页
    path: 'home',
    component: HomeComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent }
    ]
  },
  { path: 'roomSelector', component: RoomSelectorComponent, data: { animation: 'isLeft' },canActivate:[AuthGuard]},
  { path: 'profile', component: ProfileComponent, data: { animation: 'isRight' },canActivate:[AuthGuard]},
  { path: 'game/:id', component: GameComponent,data:{animation:'isDark'}},
  { path: 'test', component:AnswerResultComponent}
  // {path:'videoHome',component:VideoHomepageComponent},
  // {path:'homepage',component:HomepageComponent},
  //canActivate:[AuthGuard]
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthGuard]
})
export class AppRoutingModule { }