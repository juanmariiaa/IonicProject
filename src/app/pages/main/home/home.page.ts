import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonLabel,
  IonItem,
  IonItemSliding,
  IonList,
  IonItemOptions,
  IonItemOption,
  IonAvatar,
  IonChip,
  IonSkeletonText,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  IonCard,
} from '@ionic/angular/standalone';
import { UtilsService } from 'src/app/services/utils.service';
import { FirebaseService } from 'src/app/services/firebase.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { addIcons } from 'ionicons';
import { add, createOutline, trashOutline, cubeOutline } from 'ionicons/icons';
import { AddUpdateProductComponent } from 'src/app/shared/components/add-update-product/add-update-product.component';
import { Product } from 'src/app/models/product.model';
import { User } from 'src/app/models/user.model';
import { SupabaseService } from 'src/app/services/supabase.service';
import { QueryOptions } from '../../../services/query-options.interface';
import { IonRefresherCustomEvent } from '@ionic/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonCard,
    IonRefresherContent,
    IonRefresher,
    IonSkeletonText,
    IonChip,
    IonAvatar,
    IonItemOption,
    IonItemOptions,
    IonList,
    IonItemSliding,
    IonItem,
    IonLabel,
    IonIcon,
    IonFabButton,
    IonFab,
    IonContent,
    CommonModule,
    FormsModule,
    HeaderComponent,
  ],
})
export class HomePage implements OnInit {
  utilsService = inject(UtilsService);
  firebaseService = inject(FirebaseService);
  supabaseService = inject(SupabaseService);
  products: Product[] = [];
  loading: boolean = false;
  constructor() {
    addIcons({ createOutline, trashOutline, cubeOutline, add });
  }

  ngOnInit() {}

  async getProducts() {
    this.loading = true;
    const user = this.utilsService.getLocalStorageUser();
    const path: string = `users/${user.uid}/products`;
    const queryOptions: QueryOptions = {
      orderBy: { field: 'price', direction: 'desc' },
    };

    let timer: any;

    const resetTimer = () => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        sub.unsubscribe();
      }, 5000);
    };

    let sub = (
      await this.firebaseService.getCollectionData(path, queryOptions)
    ).subscribe({
      next: (res: any) => {
        console.log('Recibido cambio');
        console.log(res);
        this.products = res;
        this.loading = false;
        resetTimer();
      },
    });
  }

  async addUpdateProduct(product?: Product) {
    let success = await this.utilsService.presentModal({
      component: AddUpdateProductComponent,
      cssClass: 'add-update-modal',
      componentProps: { product },
    });
    if (success) {
      this.getProducts();
    }
  }

  ionViewWillEnter() {
    this.getProducts();
  }

  confirmDeleteProduct(product: Product) {
    this.utilsService.presentAlert({
      header: 'Eliminar producto',
      message: '¿Está seguro de que desea eliminar el producto?',
      buttons: [
        {
          text: 'No',
        },
        {
          text: 'Sí',
          handler: () => {
            this.deleteProduct(product);
          },
        },
      ],
    });
  }

  async deleteProduct(product: Product) {
    const loading = await this.utilsService.loading();
    await loading.present();

    const user: User = this.utilsService.getLocalStorageUser();

    const path: string = `users/${user.uid}/products/${product.id}`;

    const imagePath = this.supabaseService.getFilePath(product.image);
    await this.supabaseService.deleteFile(imagePath!);

    this.firebaseService
      .deleteDocument(path)
      .then((res) => {
        this.products = this.products.filter(
          (listedProduct) => listedProduct.id !== product.id
        );
        this.utilsService.presentToast({
          color: 'success',
          duration: 1500,
          message: 'Producto borrado exitosamente',
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

  doRefresh(event: any) {
    setTimeout(() => {
      this.getProducts();
      event.target.complete();
    }, 2000);
  }

  getTotalValue() {
    return this.products.reduce(
      (total, product) => total + product.price * product.stock,
      0
    );
  }
}