import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  IonContent,
  IonFab,
  IonIcon,
  IonFabButton,
  IonLabel,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonItem,
  IonAvatar,
  IonList,
  IonChip,
  IonSkeletonText,
  IonRefresher,
  IonRefresherContent,
  IonCard,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, createOutline, trashOutline, bodyOutline } from 'ionicons/icons';
import { Miniature } from 'src/app/models/miniature.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { SupabaseService } from 'src/app/services/supabase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AddUpdateMiniatureComponent } from 'src/app/shared/components/add-update-miniature/add-update-miniature.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { QueryOptions } from 'src/app/services/query-options.interface';

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
    IonList,
    IonAvatar,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonLabel,
    IonFabButton,
    IonIcon,
    IonFab,
    HeaderComponent,
    IonContent,
    CommonModule,
  ],
})
export class HomePage implements OnInit {
  firebaseService = inject(FirebaseService);
  utilsService = inject(UtilsService);
  supabaseService = inject(SupabaseService);
  miniatures: Miniature[] = [];
  loading: boolean = false;
  constructor() {
    addIcons({ createOutline, trashOutline, bodyOutline, add });
  }

  ngOnInit() {}

  getMiniatures() {
    this.loading = true;
    const user: User = this.utilsService.getLocalStoredUser()!;
    const path: string = `users/${user.uid}/miniatures`;

    const queryOptions: QueryOptions = {
      orderBy: { field: 'strength', direction: 'desc' },
    };

    let timer: any;
    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        console.log(
          'No hay más novedades en 5 segundos. Cancelando suscripción.'
        );
        sub.unsubscribe();
        this.loading = false;
      }, 5000);
    };

    const sub = this.firebaseService
      .getCollectionData(path, queryOptions)
      .subscribe({
        next: (res: any) => {
          this.miniatures = res;
          this.loading = false;

          resetTimer();
        },
        error: (error) => {
          console.error('Error al obtener los datos:', error);
          this.loading = false;

          if (timer) clearTimeout(timer);
        },
      });

    resetTimer();
  }

  getTotalPower() {
    return this.miniatures.reduce(
      (accumulator, miniature) =>
        accumulator + miniature.strength * miniature.units,
      0
    );
  }

  async addUpdateMiniature(miniature?: Miniature) {
    let success = await this.utilsService.presentModal({
      component: AddUpdateMiniatureComponent,
      cssClass: 'add-update-modal',
      componentProps: { miniature },
    });
    if (success) {
      this.getMiniatures();
    }
  }

  ionViewWillEnter() {
    this.getMiniatures();
  }

  doRefresh(event: any) {
    setTimeout(() => {
      this.getMiniatures();
      event.target.complete();
    }, 2000);
  }

  async deleteMiniature(miniature: Miniature) {
    const loading = await this.utilsService.loading();
    await loading.present();
    const user: User = this.utilsService.getLocalStoredUser()!;
    const path: string = `users/${user.uid}/miniatures/${miniature!.id}`;

    const imagePath = await this.supabaseService.getFilePath(miniature!.image);
    await this.supabaseService.deleteFile(imagePath!);
    this.firebaseService
      .deleteDocument(path)
      .then(async (res) => {
        this.miniatures = this.miniatures.filter(
          (listedMiniature) => listedMiniature.id !== miniature.id
        );
        this.utilsService.presentToast({
          message: 'Mininatura borrada exitosamente',
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

  async confirmDeleteMiniature(miniature: Miniature) {
    this.utilsService.presentAlert({
      header: 'Eliminar miniatura',
      message: '¿Está seguro de que desea eliminar la miniatura?',
      mode: 'ios',
      buttons: [
        {
          text: 'No',
        },
        {
          text: 'Sí',
          handler: () => {
            this.deleteMiniature(miniature);
          },
        },
      ],
    });
  }
}
