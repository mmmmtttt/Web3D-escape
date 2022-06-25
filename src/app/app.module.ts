import { AuthService } from './services/auth.service';
import { AlertifyService } from './services/alertify.service';
import { ErrorsInterceptor } from './interceptors/errors.interceptor';
import { APP_INITIALIZER } from '@angular/core';
import { AppConfigService } from './services/app-config.service';
import { RoomSelectService } from './services/room-select.service';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { NgxEchartsModule} from "ngx-echarts";

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { HomepageComponent } from './pages/homepage/homepage.component';
import { VideoHomepageComponent } from './pages/video-homepage/video-homepage.component';
import { FigureShowComponent } from './components/figure-show/figure-show.component';
import { FigureSelectorComponent } from './components/figure-selector/figure-selector.component';
import { FigureCardComponent } from './components/figure-card/figure-card.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { HomeComponent } from './pages/home/home.component';
import { RoomSelectorComponent } from './pages/room-selector/room-selector.component';
import { ToolBarComponent } from './components/tool-bar/tool-bar.component';
import { ProfileComponent } from './pages/profile/profile.conmponent';
import { RoomCardComponent } from './components/room-card/room-card.component';
import { GameComponent } from './game/view/game/game.component';
import { ChatComponent } from './components/chat/chat.component';
import { GameSceneComponent } from './game/view/game-scene/game-scene.component';
import { GameIntroductionComponent } from './components/game-introduction/game-introduction.component';
import { BackgroundStarComponent } from './components/background-star/background-star.component';
import { LoadingComponent } from './game/view/loading/load.component';
import { MouseGuideComponent } from './game/view/mouse-guide/mouse-guide.component';
import { ImgLoadedDirective } from './pages/home/image.directive';
import { GameNPCComponent } from './game/view/game-npc/game-npc.component';
import { GameGuideComponent } from './game/view/game-guide/game-guide.component';
import { NpcButtonComponent } from './game/view/npc-button/npc-button.component';
import { ItemColumnComponent } from './game/view/item-column/item-column.component';
import { AnswerResultComponent } from './game/view/answer-result/answer-result.component';
import { NgxUiLoaderModule,NgxUiLoaderRouterModule,NgxUiLoaderConfig } from "ngx-ui-loader";

const ngxLoaderConfig:NgxUiLoaderConfig ={
  "blur": 5,
  "delay": 0,
  "fastFadeOut": true,
  "fgsColor": "#ae9fb1",
  "fgsPosition": "center-center",
  "fgsSize": 70,
  "fgsType": "square-jelly-box",
  "gap": 73,
  "logoPosition": "center-center",
  "logoSize": 120,
  "logoUrl": "",
  "masterLoaderId": "master",
  "overlayBorderRadius": "0",
  "overlayColor": "rgba(40, 40, 40, 0.8)",
  "pbColor": "#ae9fb1",
  "pbDirection": "ltr",
  "pbThickness": 3,
  "hasProgressBar": true,
  "text": "",
  "textColor": "#FFFFFF",
  "textPosition": "center-center",
  "maxTime": -1,
  "minTime": 300
}

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    HomepageComponent,
    VideoHomepageComponent,
    FigureShowComponent,
    FigureSelectorComponent,
    FigureCardComponent,
    HomeComponent,
    RoomSelectorComponent,
    ToolBarComponent,
    ProfileComponent,
    RoomCardComponent,
    GameComponent,
    ChatComponent,
    GameSceneComponent,
    GameIntroductionComponent,
    BackgroundStarComponent,
    LoadingComponent,
    MouseGuideComponent,
    ImgLoadedDirective,
    GameNPCComponent,
    GameGuideComponent,
    NpcButtonComponent,
    ItemColumnComponent,
    AnswerResultComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatStepperModule,
    HttpClientModule,
    MatCardModule,
    MatButtonToggleModule,
    MatToolbarModule,
    MatMenuModule,
    NgxEchartsModule.forRoot({
      echarts:() => import('echarts')
    }),
    NgxUiLoaderModule.forRoot(ngxLoaderConfig),
    NgxUiLoaderRouterModule.forRoot({
      //其他路由自动加载loader,到游戏的不自动
      exclude:['/game']
    })
  ],
  providers: [
    {//加载配置文件的服务
      provide: APP_INITIALIZER,
      multi: true,
      deps: [AppConfigService],
      useFactory: (appConfigService: AppConfigService) => {
        return () => {
          //Make sure to return a promise!
          return appConfigService.loadAppConfig();
        };
      },
    },
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [RoomSelectService],
      useFactory: (roomService: RoomSelectService) => {
        return () => {
          return roomService.init();
        };
      },
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorsInterceptor,
      multi: true
    },
    AuthService,
    AlertifyService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
