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
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { CustomInputComponent } from '../../../shared/components/custom-input/custom-input.component';
import {
  lockClosedOutline,
  mailOutline,
  personAddOutline,
  personOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { RouterLink } from '@angular/router';
import { FirebaseService } from 'src/app/services/firebase.service';
import { User } from 'src/app/models/user.model';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
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
export class SignUpPage implements OnInit {
  firebaseService = inject(FirebaseService);
  utilsService = inject(UtilsService);

  form = new FormGroup({
    uid: new FormControl(''),
    name: new FormControl('', [Validators.required, Validators.minLength(4)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  constructor() {
    addIcons({
      mailOutline,
      lockClosedOutline,
      personAddOutline,
      alertCircleOutline,
      personOutline,
    });
  }

  ngOnInit() {}

  async submit() {
    const loading = await this.utilsService.loading();
    await loading.present();
    this.firebaseService
      .signUp(this.form.value as User)
      .then((res) => {
        this.firebaseService.updateUser(this.form.value.name!);
        let uid = res.user.uid;
        this.form.controls.uid.setValue(uid);
        this.setUserInfo(uid);
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

  async setUserInfo(uid: string) {
    if (this.form.valid) {
      const loading = await this.utilsService.loading();
      await loading.present();

      let path: string = `users/${uid}`;
      delete this.form.value.password;

      this.firebaseService
        .setDocument(path, this.form.value)
        .then((res) => {
          this.utilsService.saveInLocalStorage('user', this.form.value);
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
