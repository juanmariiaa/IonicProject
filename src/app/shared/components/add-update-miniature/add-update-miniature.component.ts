import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonAvatar,
} from '@ionic/angular/standalone';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { CustomInputComponent } from '../../../shared/components/custom-input/custom-input.component';
import {
  lockClosedOutline,
  mailOutline,
  bodyOutline,
  personOutline,
  alertCircleOutline,
  imageOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { FirebaseService } from 'src/app/services/firebase.service';
import { User } from 'src/app/models/user.model';
import { UtilsService } from 'src/app/services/utils.service';
import { SupabaseService } from 'src/app/services/supabase.service';
import { Miniature } from 'src/app/models/miniature.model';

@Component({
  selector: 'app-add-update-miniature',
  templateUrl: './add-update-miniature.component.html',
  styleUrls: ['./add-update-miniature.component.scss'],
  imports: [
    IonAvatar,
    IonIcon,
    IonButton,
    IonContent,
    CommonModule,
    FormsModule,
    HeaderComponent,
    CustomInputComponent,
    ReactiveFormsModule,
  ],
})
export class AddUpdateMiniatureComponent implements OnInit {
  @Input() miniature: Miniature | null = null;
  firebaseService = inject(FirebaseService);
  utilsService = inject(UtilsService);
  supabaseService = inject(SupabaseService);
  user: User = {} as User;

  form = new FormGroup({
    id: new FormControl(''),
    name: new FormControl('', [Validators.required, Validators.minLength(4)]),
    image: new FormControl('', [Validators.required]),
    units: new FormControl(1, [Validators.required, Validators.min(1)]),
    strength: new FormControl(0, [Validators.required, Validators.min(0)]),
  });

  constructor() {
    addIcons({
      mailOutline,
      lockClosedOutline,
      bodyOutline,
      alertCircleOutline,
      personOutline,
      imageOutline,
      checkmarkCircleOutline,
    });
  }

  ngOnInit() {
    this.user = this.utilsService.getLocalStorageUser();
    if (this.miniature) {
      this.form.setValue(this.miniature);
    }
  }

  async takeImage() {
    const dataUrl = (
      await this.utilsService.takePicture('Imagen de la miniatura')
    ).dataUrl;
    if (dataUrl) {
      this.form.controls.image.setValue(dataUrl);
    }
  }

  async submit() {
    if (this.miniature) {
      this.updateMiniature();
    } else {
      this.createMiniature();
    }
  }

  async createMiniature() {
    const loading = await this.utilsService.loading();
    await loading.present();

    const path: string = `users/${this.user.uid}/miniatures`;

    const imageDataUrl = this.form.value.image;
    const imagePath = `${this.user.uid}/${Date.now()}`;
    const imageUrl = await this.supabaseService.uploadImage(
      imagePath,
      imageDataUrl!
    );
    this.form.controls.image.setValue(imageUrl);
    delete this.form.value.id;

    this.firebaseService
      .addDocument(path, this.form.value)
      .then((res) => {
        this.utilsService.dismissModal({ success: true });
        this.utilsService.presentToast({
          color: 'success',
          duration: 1500,
          message: 'Miniatura añadida exitosamente',
          position: 'middle',
          icon: 'checkmark-circle-outline',
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

  async updateMiniature() {
    const loading = await this.utilsService.loading();
    await loading.present();

    const path: string = `users/${this.user.uid}/miniatures/${
      this.miniature!.id
    }`;

    if (this.form.value.image != this.miniature!.image) {
      const imageDataUrl = this.form.value.image;
      const imagePath = this.supabaseService.getFilePath(this.miniature!.image);
      const imageUrl = await this.supabaseService.uploadImage(
        imagePath!,
        imageDataUrl!
      );
      this.form.controls.image.setValue(imageUrl);
    }
    delete this.form.value.id;

    this.firebaseService
      .updateDocument(path, this.form.value)
      .then((res) => {
        this.utilsService.dismissModal({ success: true });
        this.utilsService.presentToast({
          color: 'success',
          duration: 1500,
          message: 'Miniatura editada exitosamente',
          position: 'middle',
          icon: 'checkmark-circle-outline',
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
