import { Injectable } from '@angular/core';
import { Registro } from '../models/registro.models';
import { Storage } from '@ionic/storage';
import { NavController } from '@ionic/angular';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { File } from '@ionic-native/file/ngx';

import { EmailComposer } from '@ionic-native/email-composer/ngx';

@Injectable({
  providedIn: 'root'
})
export class DataLocalService {

  guardados: Registro[] = [];

  constructor(private storage: Storage,
              private navCtrl: NavController,
              private inAppBrowser: InAppBrowser,
              private file: File,
              private emailComposer: EmailComposer ) {

    //cargar registros
    this.cargarStorage()
  }

  async cargarStorage(){
    this.guardados = await this.storage.get('registros') || []
  }


  async guardarRegistro( format: string, text:string){

    await this.cargarStorage()

    const nuevoRegistro = new Registro( format, text )

    this.guardados.unshift( nuevoRegistro )

    console.log(this.guardados)
    //registros
    this.storage.set('registros', this.guardados)
  
    this.abrirRegistro( nuevoRegistro )
  } 

  abrirRegistro(registro:Registro){

    this.navCtrl.navigateForward('/tabs/tab2')

    switch( registro.type){

      case  'http':
       this.inAppBrowser.create(registro.text, '_system');
      break

      case  'geo':
       this.navCtrl.navigateForward(`/tabs/tab2/mapa/${registro.text}`) 
      break 
    }
  }
  enviarCorreo(){

    const arrTemp = []
    const titulos = 'Tipo, Formato, Creado En, Texto\n'
    
    arrTemp.push( titulos )

    this.guardados.forEach(registro => {
      
      const linea = `${registro.type}, ${registro.format}, ${registro.created}, ${registro.text.replace(',', '')}\n`
      arrTemp.push(linea)

      this.crearArchivoFisico(arrTemp.join(''))
    });
  }

  crearArchivoFisico(text:string){

    this.file.checkFile( this.file.dataDirectory, 'registros.csv')
              .then( existe => {
                console.log('existe', existe)
                return this.escribirEnArchivo( text )
              })
              .catch( err =>{

                return this.file.createFile( this.file.dataDirectory, 'registros.csv', false )
                       .then( creado => this.escribirEnArchivo( text ))
                       .catch(err2 => console.log('no se pudo crear el archivo', err2))
              
              })

  }

  async escribirEnArchivo( text:string ){

    await this.file.writeExistingFile(this.file.dataDirectory, 'registros.csv', text)

    const archivo = `${this.file.dataDirectory}/registros.csv`
   // console.log(this.file.dataDirectory + 'registros.csv' )

    const email = {
      to: 'estebangulias@hotmail.com',
     // cc: 'erika@mustermann.de',
     // bcc: ['john@doe.com', 'jane@doe.com'],
      attachments: [
        archivo
      ],
      subject: 'Scan QR',
      body: 'Aca viene scaneada tu direccion papurri',
      isHtml: true
    }
    
    this.emailComposer.open(email);
  }
}
