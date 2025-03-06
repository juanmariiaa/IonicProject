import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseConfig.projectURL,
      environment.supabaseConfig.apiKey
    );
  }

  async uploadImage(path: string, imageUrl: string): Promise<string> {
    try {
      console.log('Iniciando subida de imagen...');
      const blob = this.dataUrlToBlob(imageUrl!);
      console.log('Blob creado:', blob);
      const file = new File([blob], path.split('/')[1] + `.png`, {
        type: 'image/png',
      });
      console.log('Archivo creado:', file);

      console.log('Subiendo imagen a Supabase...');
      const uploadResult = await this.supabase.storage
        .from(environment.supabaseConfig.bucket)
        .upload(path, file, { upsert: true });

      if (uploadResult.error) {
        console.error('Error al subir la imagen:', uploadResult.error.message);
        throw uploadResult.error;
      }

      const urlInfo = await this.supabase.storage
        .from(environment.supabaseConfig.bucket)
        .getPublicUrl(path);

      console.log('Imagen subida exitosamente. URL:', urlInfo.data.publicUrl);
      return urlInfo.data.publicUrl;
    } catch (error) {
      console.error('Error en uploadImage:', error);
      throw error;
    }
  }

  // Convertir dataUrl a Blob
  private dataUrlToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1]; // Extraer el tipo MIME (por ejemplo, "image/jpeg")
    const bstr = atob(arr[1]); // Decodificar base64
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], { type: mime });
  }

  // Obtener el path del archivo desde una URL pública
  getFilePath(publicUrl: string): string | null {
    try {
      const url = new URL(publicUrl);

      // Buscar el segmento `/storage/v1/object/public/`
      const publicPrefix =
        '/storage/v1/object/public/' + environment.supabaseConfig.bucket + '/';
      const startIndex = url.pathname.indexOf(publicPrefix);

      if (startIndex === -1) {
        throw new Error(
          'La URL no es válida o no pertenece a Supabase Storage.'
        );
      }

      // Obtener el resto de la ruta después del prefijo
      const filePath = url.pathname.substring(startIndex + publicPrefix.length);

      return filePath;
    } catch (error) {
      console.error('Error al extraer el path del archivo:', error);
      return null;
    }
  }

  // Eliminar un archivo del bucket de Supabase
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(environment.supabaseConfig.bucket)
        .remove([filePath]);
      if (error) {
        console.error('Error al eliminar el archivo:', error.message);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error en deleteFile:', error);
      return false;
    }
  }
}
