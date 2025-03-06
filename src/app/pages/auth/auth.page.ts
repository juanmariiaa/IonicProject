import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { CustomInputComponent } from '../../shared/components/custom-input/custom-input.component';
import {
  personCircle,
  lockClosedOutline,
  mailOutline,
  logInOutline,
  personAddOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { RouterLink } from '@angular/router';
import { FirebaseService } from 'src/app/services/firebase.service';
import { User } from 'src/app/models/user.model';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  standalone: true,
  imports: [
    RouterLink,
    IonIcon,
    IonButton,
    IonContent,
    CommonModule,
    FormsModule,
    HeaderComponent,
    CustomInputComponent,
    ReactiveFormsModule,
    LogoComponent,
  ],
})
export class AuthPage implements OnInit {
  firebaseService = inject(FirebaseService);
  utilsService = inject(UtilsService);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  constructor() {
    addIcons({
      personCircle,
      mailOutline,
      lockClosedOutline,
      logInOutline,
      personAddOutline,
      alertCircleOutline,
    });
  }

  ngOnInit() {}

  async submit() {
    const loading = await this.utilsService.loading();
    await loading.present();
    this.firebaseService
      .signIn(this.form.value as User)
      .then((res) => {
        this.getUserInfo(res.user.uid);
      })
      .catch((error) => {
        this.utilsService.presentToast({
          color: 'danger',
          duration: 2500,
          message: error.message,
          position: 'middle',
          icon: 'alert-circle-outline',
        });
      })
      .finally(() => {
        loading.dismiss();
      });
  }

  async getUserInfo(uid: string) {
    if (this.form.valid) {
      const loading = await this.utilsService.loading();
      await loading.present();

      let path: string = `users/${uid}`;

      this.firebaseService
        .getDocument(path)
        .then((userData: any) => {
          const user: User = userData;
          this.utilsService.saveInLocalStorage('user', user);
          this.utilsService.presentToast({
            color: 'success',
            duration: 1500,
            message: `Sesión iniciada como ${user.name}`,
            position: 'middle',
            icon: 'person-circle-outline',
          });
          this.form.reset();
          this.utilsService.routerLink('/main/home');
        })
        .catch((error) => {
          this.utilsService.presentToast({
            color: 'danger',
            duration: 2500,
            message: error.message,
            position: 'middle',
            icon: 'alert-circle-outline',
          });
        })
        .finally(() => {
          loading.dismiss();
        });
    }
  }
}
