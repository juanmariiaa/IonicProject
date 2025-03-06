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
import { HeaderComponent } from '../header/header.component';
import { CustomInputComponent } from '../custom-input/custom-input.component';
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
import { Product } from 'src/app/models/product.model';

@Component({
  selector: 'app-add-update-product',
  templateUrl: './add-update-product.component.html',
  styleUrls: ['./add-update-product.component.scss'],
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
export class AddUpdateProductComponent implements OnInit {
  @Input() product: Product | null = null;
  firebaseService = inject(FirebaseService);
  utilsService = inject(UtilsService);
  supabaseService = inject(SupabaseService);
  user: User = {} as User;

  form = new FormGroup({
    id: new FormControl(''),
    name: new FormControl('', [Validators.required, Validators.minLength(4)]),
    image: new FormControl('', [Validators.required]),
    stock: new FormControl(1, [Validators.required, Validators.min(1)]),
    price: new FormControl(0, [Validators.required, Validators.min(0)]),
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
    if (this.product) {
      this.form.setValue(this.product);
    }
  }

  async takeImage() {
    const dataUrl = (
      await this.utilsService.takePicture('Imagen del producto')
    ).dataUrl;
    if (dataUrl) {
      this.form.controls.image.setValue(dataUrl);
    }
  }

  async submit() {
    if (this.product) {
      this.updateProduct();
    } else {
      this.createProduct();
    }
  }

  async createProduct() {
    const loading = await this.utilsService.loading();
    await loading.present();

    const path: string = `users/${this.user.uid}/products`;

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
          message: 'Producto añadido exitosamente',
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

  async updateProduct() {
    const loading = await this.utilsService.loading();
    await loading.present();

    const path: string = `users/${this.user.uid}/products/${
      this.product!.id
    }`;

    if (this.form.value.image != this.product!.image) {
      const imageDataUrl = this.form.value.image;
      const imagePath = this.supabaseService.getFilePath(this.product!.image);
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
          message: 'Producto editado exitosamente',
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