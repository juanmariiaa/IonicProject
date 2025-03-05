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
  IonIcon,
  IonHeader,
  IonToolbar,
} from '@ionic/angular/standalone';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { CustomInputComponent } from 'src/app/shared/components/custom-input/custom-input.component';
import { addIcons } from 'ionicons';
import {
  lockClosedOutline,
  mailOutline,
  personAddOutline,
  personOutline,
  alertCircleOutline,
  imageOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import { IonButton, IonAvatar } from '@ionic/angular/standalone';
import { FirebaseService } from 'src/app/services/firebase.service';
import { SupabaseService } from 'src/app/services/supabase.service';
import { User } from 'src/app/models/user.model';
import { UtilsService } from 'src/app/services/utils.service';
import { Recipe } from 'src/app/models/recipe.model';

@Component({
  selector: 'app-add-update-recipe',
  templateUrl: './add-update-recipe.component.html',
  styleUrls: ['./add-update-recipe.component.scss'],
  imports: [
    IonIcon,
    HeaderComponent,
    IonContent,
    CommonModule,
    FormsModule,
    CustomInputComponent,
    ReactiveFormsModule,
    IonButton,
    IonAvatar,
  ],
})
export class AddUpdateMiniatureComponent implements OnInit {
  @Input() recipe: Recipe | null = null;
  firebaseService = inject(FirebaseService);
  supabaseService = inject(SupabaseService);
  utilsService = inject(UtilsService);

  user = {} as User;

  form = new FormGroup({
    id: new FormControl(''),
    image: new FormControl('', [Validators.required]),
    name: new FormControl('', [Validators.required, Validators.minLength(4)]),
    calories: new FormControl(1, [Validators.required, Validators.min(1)]),
  });

  constructor() {
    addIcons({
      mailOutline,
      lockClosedOutline,
      personAddOutline,
      personOutline,
      alertCircleOutline,
      imageOutline,
      checkmarkCircleOutline,
    });
  }
  ngOnInit() {
    this.user = this.utilsService.getFromLocalStorage('user');
    if (this.recipe) {
      this.form.setValue(this.recipe);
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
    if (this.form.valid) {
      if (this.recipe) {
        this.UpdateMiniature();
      } else {
        this.createMiniature();
      }
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
      .then(async (res) => {
        this.utilsService.dismissModal({ success: true });
        this.utilsService.presentToast({
          message: 'Mininatura añadida exitosamente',
          duration: 1500,
          color: 'success',
          position: 'middle',
          icon: 'checkmark-circle-outline',
        });
      })
      .catch((error) => {
        this.utilsService.presentToast({
          message: error.message,
          duration: 2500,
          color: 'danger',
          position: 'middle',
          icon: 'alert-circle-outline',
        });
      })
      .finally(() => {
        loading.dismiss();
      });
  }

  async UpdateMiniature() {
    const loading = await this.utilsService.loading();
    await loading.present();

    const path: string = `users/${this.user.uid}/miniatures/${this.recipe!.id}`;
    if (this.form.value.image != this.recipe!.image) {
      const imageDataUrl = this.form.value.image;
      const oldImagePath = await this.firebaseService.getFilePath(
        this.recipe!.image
      );
      await this.firebaseService.deleteFile(oldImagePath);
      const imagePath = `${this.user.uid}/${Date.now()}`;
      const imageUrl = await this.supabaseService.uploadImage(
        imagePath,
        imageDataUrl!
      );
      this.form.controls.image.setValue(imageUrl);
    }
    delete this.form.value.id;

    this.firebaseService
      .updateDocument(path, this.form.value)
      .then(async (res) => {
        this.utilsService.dismissModal({ success: true });
        this.utilsService.presentToast({
          message: 'Mininatura editada exitosamente',
          duration: 1500,
          color: 'success',
          position: 'middle',
          icon: 'checkmark-circle-outline',
        });
      })
      .catch((error) => {
        this.utilsService.presentToast({
          message: error.message,
          duration: 2500,
          color: 'danger',
          position: 'middle',
          icon: 'alert-circle-outline',
        });
      })
      .finally(() => {
        loading.dismiss();
      });
  }
}
