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
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { CustomInputComponent } from 'src/app/shared/components/custom-input/custom-input.component';
import {
  mailOutline,
  alertCircleOutline,
  sendOutline,
  mailUnreadOutline,
} from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { LogoComponent } from 'src/app/shared/components/logo/logo.component';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [
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
export class ForgotPasswordPage implements OnInit {
  firebaseService = inject(FirebaseService);
  utilsService = inject(UtilsService);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  constructor() {
    addIcons({
      sendOutline,
      mailOutline,
      alertCircleOutline,
      mailUnreadOutline,
    });
  }

  ngOnInit() {}

  async submit() {
    const loading = await this.utilsService.loading();
    await loading.present();
    this.firebaseService
      .sendRecoveryEmail(this.form.value.email!)
      .then((res) => {
        this.utilsService.presentToast({
          color: 'primary',
          duration: 1500,
          message: 'Correo enviado en caso de existir la cuenta',
          position: 'middle',
          icon: 'mail-unread-outline',
        });
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
