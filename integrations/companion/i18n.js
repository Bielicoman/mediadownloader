(function(root){'use strict';
var languages={pt:'Português (Brasil)',en:'English',es:'Español',fr:'Français · Beta',de:'Deutsch · Beta',it:'Italiano · Beta'};
var rows=`Idioma|Language|Idioma|Langue|Sprache|Lingua
Configurações|Settings|Configuración|Paramètres|Einstellungen|Impostazioni
Configurações & Diagnóstico|Settings & diagnostics|Configuración y diagnóstico|Paramètres et diagnostic|Einstellungen und Diagnose|Impostazioni e diagnostica
Salvar Configurações|Save settings|Guardar configuración|Enregistrer les paramètres|Einstellungen speichern|Salva impostazioni
Salvar|Save|Guardar|Enregistrer|Speichern|Salva
Fechar|Close|Cerrar|Fermer|Schließen|Chiudi
Cancelar|Cancel|Cancelar|Annuler|Abbrechen|Annulla
Seu próximo download.|Your next download.|Tu próxima descarga.|Votre prochain téléchargement.|Dein nächster Download.|Il tuo prossimo download.
SEU ESPAÇO DE MÍDIA|YOUR MEDIA SPACE|TU ESPACIO MULTIMEDIA|VOTRE ESPACE MULTIMÉDIA|DEIN MEDIENBEREICH|IL TUO SPAZIO MULTIMEDIALE
Seu espaço de mídia|Your media space|Tu espacio multimedia|Votre espace multimédia|Dein Medienbereich|Il tuo spazio multimediale
Cole um link, escolha o formato e deixe tudo pronto para editar.|Paste a link, choose a format and get ready to edit.|Pega un enlace, elige el formato y prepara tu edición.|Collez un lien, choisissez un format et préparez votre montage.|Link einfügen, Format wählen und den Schnitt vorbereiten.|Incolla un link, scegli il formato e prepara il montaggio.
Vídeo ou áudio|Video or audio|Vídeo o audio|Vidéo ou audio|Video oder Audio|Video o audio
Playlist ou canal|Playlist or channel|Lista o canal|Playlist ou chaîne|Playlist oder Kanal|Playlist o canale
Vários links|Multiple links|Varios enlaces|Plusieurs liens|Mehrere Links|Più link
Playlist|Playlist|Lista de reproducción|Playlist|Playlist|Playlist
Link da mídia|Media link|Enlace del contenido|Lien du média|Medienlink|Link del contenuto
LINK DA MÍDIA|MEDIA LINK|ENLACE DEL CONTENIDO|LIEN DU MÉDIA|MEDIENLINK|LINK DEL CONTENUTO
LINK DA PLAYLIST OU DO CANAL|PLAYLIST OR CHANNEL LINK|ENLACE DE LISTA O CANAL|LIEN DE PLAYLIST OU CHAÎNE|PLAYLIST- ODER KANALLINK|LINK DELLA PLAYLIST O DEL CANALE
Cole uma lista de URLs (uma por linha):|Paste a list of URLs (one per line):|Pega una lista de URL (una por línea):|Collez des URL (une par ligne) :|URLs einfügen (eine pro Zeile):|Incolla gli URL (uno per riga):
Colar|Paste|Pegar|Coller|Einfügen|Incolla
Colar links|Paste links|Pegar enlaces|Coller des liens|Links einfügen|Incolla link
Colar exemplo|Paste example|Pegar ejemplo|Coller un exemple|Beispiel einfügen|Incolla esempio
Indexar Vídeos|Load videos|Cargar vídeos|Charger les vidéos|Videos laden|Carica video
Baixar Mídia|Download media|Descargar contenido|Télécharger le média|Medien herunterladen|Scarica contenuto
Baixar mídia|Download media|Descargar contenido|Télécharger le média|Medien herunterladen|Scarica contenuto
Baixar selecionados|Download selected|Descargar seleccionados|Télécharger la sélection|Auswahl herunterladen|Scarica selezionati
Baixar|Download|Descargar|Télécharger|Herunterladen|Scarica
Qualidade e formato|Quality and format|Calidad y formato|Qualité et format|Qualität und Format|Qualità e formato
QUALIDADE E FORMATO|QUALITY AND FORMAT|CALIDAD Y FORMATO|QUALITÉ ET FORMAT|QUALITÄT UND FORMAT|QUALITÀ E FORMATO
Qualidade padrão ao abrir|Default quality on startup|Calidad predeterminada al abrir|Qualité par défaut au démarrage|Standardqualität beim Start|Qualità predefinita all'avvio
Máxima qualidade disponível|Maximum available quality|Máxima calidad disponible|Qualité maximale disponible|Höchste verfügbare Qualität|Massima qualità disponibile
Máxima disponível|Best available|Máxima disponible|Maximum disponible|Beste verfügbare|Massima disponibile
Máxima qualidade · MP4|Maximum quality · MP4|Máxima calidad · MP4|Qualité maximale · MP4|Höchste Qualität · MP4|Massima qualità · MP4
Áudio original|Original audio|Audio original|Audio original|Originalaudio|Audio originale
Áudio WAV|WAV audio|Audio WAV|Audio WAV|WAV-Audio|Audio WAV
Áudio MP3|MP3 audio|Audio MP3|Audio MP3|MP3-Audio|Audio MP3
Áudio FLAC|FLAC audio|Audio FLAC|Audio FLAC|FLAC-Audio|Audio FLAC
Áudio M4A|M4A audio|Audio M4A|Audio M4A|M4A-Audio|Audio M4A
Capa PNG|PNG cover|Portada PNG|Couverture PNG|PNG-Cover|Copertina PNG
Vídeo MP4|MP4 video|Vídeo MP4|Vidéo MP4|MP4-Video|Video MP4
Vídeo original|Original video|Vídeo original|Vidéo originale|Originalvideo|Video originale
Lista|List|Lista|Liste|Liste|Elenco
Grade|Grid|Cuadrícula|Grille|Raster|Griglia
Tamanho|Size|Tamaño|Taille|Größe|Dimensione
Tamanho das miniaturas|Thumbnail size|Tamaño de miniaturas|Taille des miniatures|Vorschaubildgröße|Dimensione miniature
Remover|Remove|Eliminar|Supprimer|Entfernen|Rimuovi
Limpar|Clear|Limpiar|Effacer|Leeren|Cancella
Selecionar todos|Select all|Seleccionar todos|Tout sélectionner|Alle auswählen|Seleziona tutto
Dados da mídia|Media details|Datos del contenido|Détails du média|Mediendetails|Dettagli del contenuto
Dados da fonte|Source details|Datos de la fuente|Détails de la source|Quelldetails|Dettagli della fonte
Arquivo final|Final file|Archivo final|Fichier final|Enddatei|File finale
Título|Title|Título|Titre|Titel|Titolo
Autor|Author|Autor|Auteur|Autor|Autore
Duração|Duration|Duración|Durée|Dauer|Durata
Resolução|Resolution|Resolución|Résolution|Auflösung|Risoluzione
Formato|Format|Formato|Format|Format|Formato
Compressão|Compression|Compresión|Compression|Kompression|Compressione
Metadados|Metadata|Metadatos|Métadonnées|Metadaten|Metadati
Seus downloads|Your downloads|Tus descargas|Vos téléchargements|Deine Downloads|I tuoi download
Nenhum download recente ainda|No recent downloads yet|Todavía no hay descargas recientes|Aucun téléchargement récent|Noch keine Downloads|Nessun download recente
Destino:|Destination:|Destino:|Destination :|Ziel:|Destinazione:
Alterar|Change|Cambiar|Modifier|Ändern|Cambia
Abrir|Open|Abrir|Ouvrir|Öffnen|Apri
Abrir pasta|Open folder|Abrir carpeta|Ouvrir le dossier|Ordner öffnen|Apri cartella
Alterar pasta|Change folder|Cambiar carpeta|Changer de dossier|Ordner ändern|Cambia cartella
Procurar...|Browse...|Examinar...|Parcourir...|Durchsuchen...|Sfoglia...
Selecionar...|Select...|Seleccionar...|Sélectionner...|Auswählen...|Seleziona...
Pasta Padrão de Downloads:|Default download folder:|Carpeta de descarga predeterminada:|Dossier de téléchargement par défaut :|Standard-Downloadordner:|Cartella download predefinita:
Arquivo de cookies (opcional):|Cookies file (optional):|Archivo de cookies (opcional):|Fichier cookies (facultatif) :|Cookie-Datei (optional):|File cookie (facoltativo):
Status dos Motores:|Engine status:|Estado de los motores:|État des moteurs :|Engine-Status:|Stato dei motori:
Verificando...|Checking...|Comprobando...|Vérification...|Wird geprüft...|Verifica...
Preparando…|Preparing…|Preparando…|Préparation…|Vorbereitung…|Preparazione…
Só este vídeo|Only this video|Solo este vídeo|Cette vidéo uniquement|Nur dieses Video|Solo questo video
Playlist completa|Full playlist|Lista completa|Playlist complète|Gesamte Playlist|Playlist completa
Este link contém uma playlist. O que quer adicionar?|This link includes a playlist. What would you like to add?|Este enlace incluye una lista. ¿Qué quieres añadir?|Ce lien contient une playlist. Que souhaitez-vous ajouter ?|Dieser Link enthält eine Playlist. Was möchtest du hinzufügen?|Questo link contiene una playlist. Cosa vuoi aggiungere?
Mais perto do seu próximo corte.|Closer to your next cut.|Más cerca de tu próximo corte.|Plus près de votre prochain montage.|Näher an deinem nächsten Schnitt.|Più vicino al tuo prossimo montaggio.
Baixe, escolha o destino e leve a mídia para o seu editor.|Download, choose a destination and bring the media into your editor.|Descarga, elige el destino y lleva el contenido a tu editor.|Téléchargez, choisissez une destination et ouvrez le média dans votre logiciel.|Herunterladen, Ziel wählen und Medien in den Editor übernehmen.|Scarica, scegli la destinazione e porta il contenuto nel tuo editor.
1. Prepare sua mídia|1. Prepare your media|1. Prepara tu contenido|1. Préparez votre média|1. Medien vorbereiten|1. Prepara il contenuto
2. Leve para o editor|2. Bring it into your editor|2. Lleva al editor|2. Ouvrez dans votre logiciel|2. In den Editor übernehmen|2. Porta nell'editor
Usar arquivo existente|Use existing file|Usar archivo existente|Utiliser un fichier existant|Vorhandene Datei verwenden|Usa file esistente
Nenhum arquivo selecionado.|No file selected.|Ningún archivo seleccionado.|Aucun fichier sélectionné.|Keine Datei ausgewählt.|Nessun file selezionato.
Importar|Import|Importar|Importer|Importieren|Importa
Arrastar mídia|Drag media|Arrastrar contenido|Glisser le média|Medien ziehen|Trascina contenuto
O aplicativo|The app|La aplicación|L'application|Die App|L'app
Como instalar|How to install|Cómo instalar|Installation|Installation|Come installare
Baixar o aplicativo|Download the app|Descargar la aplicación|Télécharger l'application|App herunterladen|Scarica l'app
Ver como instalar|See installation guide|Ver cómo instalar|Guide d'installation|Installationsanleitung|Guida all'installazione
Sua mídia,|Your media,|Tu contenido,|Vos médias,|Deine Medien,|I tuoi contenuti,
pronta para editar.|ready to edit.|listo para editar.|prêts à monter.|bereit zum Schneiden.|pronti da montare.
Qual é o seu sistema?|What is your operating system?|¿Cuál es tu sistema?|Quel est votre système ?|Welches System nutzt du?|Qual è il tuo sistema?
Pronto para o seu Windows.|Ready for your Windows PC.|Listo para tu Windows.|Prêt pour votre Windows.|Bereit für deinen Windows-PC.|Pronto per il tuo Windows.
Baixar instalador .EXE|Download .EXE installer|Descargar instalador .EXE|Télécharger l'installateur .EXE|EXE-Installer herunterladen|Scarica installer .EXE
Instale em três passos|Install in three steps|Instala en tres pasos|Installez en trois étapes|In drei Schritten installieren|Installa in tre passaggi
Escolha o seu Mac.|Choose your Mac.|Elige tu Mac.|Choisissez votre Mac.|Wähle deinen Mac.|Scegli il tuo Mac.
Baixar painel Adobe|Download Adobe panel|Descargar panel Adobe|Télécharger le panneau Adobe|Adobe-Panel herunterladen|Scarica pannello Adobe
Baixar companion Windows|Download Windows companion|Descargar companion Windows|Télécharger le companion Windows|Windows-Companion herunterladen|Scarica companion Windows
Companion macOS|macOS companion|Companion macOS|Companion macOS|macOS-Companion|Companion macOS
Privacidade|Privacy|Privacidad|Confidentialité|Datenschutz|Privacy
Termos de uso|Terms of use|Términos de uso|Conditions d'utilisation|Nutzungsbedingungen|Condizioni d'uso
Licenças e créditos|Licenses and credits|Licencias y créditos|Licences et crédits|Lizenzen und Quellen|Licenze e crediti
Acessibilidade|Accessibility|Accesibilidad|Accessibilité|Barrierefreiheit|Accessibilità
Ajuda e contato|Help and contact|Ayuda y contacto|Aide et contact|Hilfe und Kontakt|Aiuto e contatti
Código e versões|Source and releases|Código y versiones|Code et versions|Quellcode und Versionen|Codice e versioni
Voltar ao site|Back to website|Volver al sitio|Retour au site|Zurück zur Website|Torna al sito
Ver demonstração|Play demo|Ver demostración|Voir la démo|Demo starten|Avvia demo
Repetir demonstração|Replay demo|Repetir demostración|Revoir la démo|Demo wiederholen|Ripeti demo
Pausar demonstração|Pause demo|Pausar demostración|Mettre en pause|Demo pausieren|Pausa demo
Baixar exemplo|Download example|Descargar ejemplo|Télécharger l'exemple|Beispiel herunterladen|Scarica esempio
Uma prévia interativa. Nenhum arquivo será baixado.|An interactive demo. No files will be downloaded.|Demostración interactiva. No se descargará ningún archivo.|Démo interactive. Aucun fichier ne sera téléchargé.|Interaktive Demo. Es werden keine Dateien heruntergeladen.|Demo interattiva. Nessun file verrà scaricato.
Arquivo de exemplo pronto|Example file ready|Archivo de ejemplo listo|Fichier d'exemple prêt|Beispieldatei bereit|File di esempio pronto
Arquivo salvo|File saved|Archivo guardado|Fichier enregistré|Datei gespeichert|File salvato
Abrir arquivo|Open file|Abrir archivo|Ouvrir le fichier|Datei öffnen|Apri file
Baixar outro|Download another|Descargar otro|Télécharger un autre|Weiteren Download starten|Scarica un altro
Tentar novamente|Try again|Intentar de nuevo|Réessayer|Erneut versuchen|Riprova
Atualizar motor|Update engine|Actualizar motor|Mettre à jour le moteur|Engine aktualisieren|Aggiorna motore
Ocultar detalhes técnicos|Hide technical details|Ocultar detalles técnicos|Masquer les détails techniques|Technische Details ausblenden|Nascondi dettagli tecnici
Ver detalhes técnicos|Show technical details|Ver detalles técnicos|Afficher les détails techniques|Technische Details anzeigen|Mostra dettagli tecnici
Não foi possível baixar|Unable to download|No se pudo descargar|Téléchargement impossible|Download fehlgeschlagen|Download non riuscito`;
var catalog={},codes=['pt','en','es','fr','de','it'];rows.split('\n').forEach(function(line){var a=line.split('|');catalog[a[0]]=a;});
var locale='pt';try{var saved=root.localStorage.getItem('mediadownloader_language');locale=languages[saved]?saved:(navigator.language||'pt').slice(0,2);if(!languages[locale])locale='en';}catch(e){}
function t(value){var a=catalog[value];if(a)return a[codes.indexOf(locale)]||value;var m=value.match(/^Até (.+)$/);if(m)return ({en:'Up to ',es:'Hasta ',fr:"Jusqu’à ",de:'Bis zu ',it:'Fino a ',pt:'Até '}[locale])+m[1];return value;}
var records=new WeakMap(),pending=false,observer;
function text(node){var raw=node.nodeValue,rec=records.get(node);if(!rec||rec.last!==raw)rec={base:raw,last:raw};var trim=rec.base.trim(),out=t(trim);if(out!==trim)out=rec.base.replace(trim,out);else out=rec.base;if(raw!==out)node.nodeValue=out;rec.last=out;records.set(node,rec);}
function refresh(){pending=false;if(observer)observer.disconnect();var walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);var n;while((n=walk.nextNode())){if(n.parentElement&&!n.parentElement.closest('script,style,code,pre,textarea,[data-user-content],.path,#previewTitle,#historyList,.collection-title'))text(n);}document.documentElement.lang=locale==='pt'?'pt-BR':locale;document.querySelectorAll('[data-language-select]').forEach(function(s){s.value=locale;});if(observer)observer.observe(document.body,{subtree:true,childList:true,characterData:true});}
function choose(code){if(!languages[code])return;locale=code;try{root.localStorage.setItem('mediadownloader_language',code);}catch(e){}refresh();document.dispatchEvent(new CustomEvent('media-language-change',{detail:{language:code}}));}
var initialized=false;function init(){if(initialized)return;initialized=true;var mount=document.querySelector('#modalSettings .modal-body')||document.querySelector('.site-header nav')||document.querySelector('main>header');if(mount){var label=document.createElement('label');label.className='language-switch';var name=document.createElement('span');name.textContent='Idioma';label.appendChild(name);var select=document.createElement('select');select.setAttribute('data-language-select','');select.setAttribute('aria-label','Language / Idioma');Object.keys(languages).forEach(function(k){var o=document.createElement('option');o.value=k;o.textContent=languages[k];select.appendChild(o);});select.addEventListener('change',function(){choose(select.value);});label.appendChild(select);mount.appendChild(label);}observer=new MutationObserver(function(){if(!pending){pending=true;queueMicrotask(refresh);}});refresh();}
root.MediaI18n={t:t,setLanguage:choose,getLanguage:function(){return locale;},languages:languages,catalog:catalog};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(typeof window==='object'?window:this);
