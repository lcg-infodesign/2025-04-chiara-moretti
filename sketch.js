let table;
let volcanoes = [];
let worldMapImg; // Immagine della mappa del mondo

// Dimensioni del riquadro
let boxWidth = 1200;
let boxHeight = 750;
let boxX, boxY; // Posizione del riquadro (centrato)

// Range di elevazione
let minElevation = Infinity;
let maxElevation = -Infinity;

// Range geografici
let minLat, maxLat, minLon, maxLon;

// Vulcano selezionato
let selectedVolcano = null;

// Variabile per l'evidenziazione delle legende quando si clicca il footer
let highlightLegends = false;
let highlightTimer = 0;

// Tipo di vulcano selezionato nella legenda (null = mostra tutti)
let selectedType = null;

function preload() {
  // Carica il file CSV
  table = loadTable('volcanoes-2025-10-27 - Es.3 - Original Data.csv', 'csv', 'header');
  
  // Prova a caricare l'immagine della mappa del mondo
  // IMPORTANTE: Per usare un'immagine da URL esterno, potrebbe essere necessario:
  // 1. Scaricare l'immagine e salvarla come 'world-map.png' nella stessa cartella
  // 2. Oppure usare un server locale (es. python -m http.server) per evitare problemi CORS
  
  // Opzione 1: Carica da file locale (consigliato)
  // Scarica l'immagine da Dreamstime e salvala come 'world-map.png' nella cartella del progetto
  try {
    worldMapImg = loadImage('world-map.png');
  } catch(e) {
    console.log('Immagine locale non trovata. Usa la mappa disegnata o aggiungi world-map.png');
    worldMapImg = null;
  }
  
  // Opzione 2: Prova a caricare da URL (potrebbe non funzionare per CORS)
  // Decommenta queste righe se vuoi provare con un URL diretto:
  // try {
  //   worldMapImg = loadImage('URL_DIRETTO_DELL_IMMAGINE');
  // } catch(e) {
  //   console.log('Errore nel caricamento dell\'immagine da URL:', e);
  //   worldMapImg = null;
  // }
}

function setup() {
  // Crea una canvas a tema scuro professionale
  createCanvas(1600, 1300); // Aumentata l'altezza per più spazio in basso
  // Sfondo scuro elegante
  background(15, 15, 20);
  
  // Processa i dati del CSV prima di calcolare la posizione
  processData();
  
  // Centra il riquadro orizzontalmente, spostato in basso per le leggende
  // Calcola la posizione Y dinamicamente in base all'altezza delle legende
  let types = getUniqueTypes();
  
  // Altezza della legenda dell'elevazione (inizia a Y=95, finisce circa a Y=175)
  let elevationLegendHeight = 175;
  
  // Altezza della legenda dei tipi
  let cols = 5;
  let rows = ceil(types.length / cols);
  let spacing = 20;
  let typeLegendStartY = 210; // Posizionata sotto la legenda dell'elevazione con margine aumentato
  let typeLegendPadding = 20;
  let typeLegendHeight = 40 + rows * spacing + typeLegendPadding * 2; // 40 per titolo + righe + padding
  
  // Posiziona il riquadro sotto le legende con margine molto ridotto
  boxX = (width - boxWidth) / 2;
  boxY = typeLegendStartY + typeLegendHeight - 5; // Spazio per tutte le legende - sovrapposizione minima
  
  // Ora che boxX e boxY sono definiti, mappa le coordinate dei vulcani
  mapVolcanoCoordinates();
}

function processData() {
  // Trova i valori minimi e massimi di latitudine, longitudine e elevazione
  minLat = Infinity;
  maxLat = -Infinity;
  minLon = Infinity;
  maxLon = -Infinity;
  
  // Prima passata: trova i range
  for (let row of table.rows) {
    let lat = parseFloat(row.getString('Latitude'));
    let lon = parseFloat(row.getString('Longitude'));
    let elevation = parseFloat(row.getString('Elevation (m)'));
    
    if (!isNaN(lat) && !isNaN(lon)) {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
    }
    
    if (!isNaN(elevation)) {
      if (elevation < minElevation) minElevation = elevation;
      if (elevation > maxElevation) maxElevation = elevation;
    }
  }
  
  // Seconda passata: salva i vulcani con coordinate geografiche (non ancora mappate)
  for (let row of table.rows) {
    let lat = parseFloat(row.getString('Latitude'));
    let lon = parseFloat(row.getString('Longitude'));
    let elevation = parseFloat(row.getString('Elevation (m)'));
    let type = row.getString('Type');
    // Prime 3 colonne
    let volcanoNumber = row.getString('Volcano Number');
    let volcanoName = row.getString('Volcano Name');
    let country = row.getString('Country');
    // Ultime 3 colonne
    let typeCategory = row.getString('TypeCategory');
    let status = row.getString('Status');
    let lastKnownEruption = row.getString('Last Known Eruption');
    
    if (!isNaN(lat) && !isNaN(lon)) {
      volcanoes.push({
        lat: lat,
        lon: lon,
        elevation: elevation,
        type: type,
        volcanoNumber: volcanoNumber,
        volcanoName: volcanoName,
        country: country,
        typeCategory: typeCategory,
        status: status,
        lastKnownEruption: lastKnownEruption
      });
    }
  }
}

// Funzione per mappare le coordinate geografiche alle coordinate dello schermo
function mapVolcanoCoordinates() {
  for (let volcano of volcanoes) {
    // Mappa le coordinate geografiche alle coordinate del riquadro
    // Longitudine -> X (da sinistra a destra)
    // Latitudine -> Y (invertita perché Y aumenta verso il basso nello schermo)
    volcano.x = map(volcano.lon, minLon, maxLon, boxX, boxX + boxWidth);
    volcano.y = map(volcano.lat, maxLat, minLat, boxY, boxY + boxHeight);
  }
}

// Funzione per ottenere tutti i tipi unici di vulcano
function getUniqueTypes() {
  let types = new Set();
  for (let volcano of volcanoes) {
    if (volcano.type && volcano.type.trim() !== '') {
      types.add(volcano.type);
    }
  }
  // Ordina i tipi per renderli più leggibili
  return Array.from(types).sort();
}

// Funzione per disegnare la legenda dei tipi
function drawTypeLegend() {
  // Controlla se ci sono vulcani caricati
  if (volcanoes.length === 0) return;
  
  let types = getUniqueTypes();
  if (types.length === 0) return;
  
  // Calcola la posizione Y basandosi sulla fine della legenda dell'elevazione
  // La legenda elevazione finisce a circa: 95 - 20 (padding) + 80 (containerHeight) + 20 (valori sotto) = 175
  let startY = 210; // Posizionata sotto la legenda dell'elevazione con margine aumentato
  let spacing = 20;
  let cols = 5; // Numero di colonne
  let itemWidth = 220; // Larghezza approssimativa di ogni elemento (glifo + testo)
  let itemMargin = 15; // Margine tra gli elementi
  
  // Calcola la larghezza totale della legenda
  let legendWidth = cols * itemWidth + (cols - 1) * itemMargin;
  
  // Centra la legenda rispetto alla canvas
  let startX = (width - legendWidth) / 2;
  
  // Assicura che la legenda non vada fuori dai bordi
  let margin = 20;
  if (startX < margin) {
    startX = margin;
    // Ricalcola itemWidth se necessario per adattarsi
    legendWidth = width - (2 * margin);
    itemWidth = (legendWidth - (cols - 1) * itemMargin) / cols;
  }
  
  // Calcola l'altezza totale necessaria
  let rows = ceil(types.length / cols);
  let totalHeight = 40 + rows * spacing;
  let padding = 20;
  
  // Istruzione sopra la legenda
  textAlign(CENTER);
  textSize(10);
  fill(180, 180, 190);
  noStroke();
  textStyle(NORMAL);
  text("Clicca su ogni categoria per visualizzare solo i vulcani corrispondenti", width / 2, startY - padding - 8);
  
  // Sfondo semi-trasparente elegante per la legenda dei tipi
  fill(25, 25, 32, 220);
  
  // Evidenziazione quando highlightLegends è true
  if (highlightLegends) {
    let pulse = sin(frameCount * 0.2) * 0.3 + 0.7; // Effetto pulsazione
    stroke(100, 150, 255, 200 * pulse); // Bordo blu pulsante
    strokeWeight(2);
  } else {
    stroke(70, 70, 80, 180);
    strokeWeight(1);
  }
  rect(startX - padding, startY - padding, legendWidth + padding * 2, totalHeight, 8);
  
  // Titolo - stile professionale migliorato
  textAlign(CENTER);
  textSize(13);
  fill(245, 245, 250);
  noStroke();
  textStyle(BOLD);
  text("Tipi di Vulcani", width / 2, startY + 5);
  
  // Linea separatrice sottile sotto il titolo
  stroke(90, 90, 100, 150);
  strokeWeight(1);
  line(startX - padding + 10, startY + 15, startX + legendWidth + padding - 10, startY + 15);
  noStroke();
  
  // Disegna ogni tipo con il suo glifo
  textAlign(LEFT);
  textSize(10);
  
  // Salva le aree cliccabili per ogni tipo (per mousePressed)
  window.typeLegendItems = [];
  
  for (let i = 0; i < types.length; i++) {
    let type = types[i];
    if (!type || type.trim() === '') continue;
    
    let col = i % cols;
    let row = floor(i / cols);
    
    let x = startX + (col * (itemWidth + itemMargin));
    let y = startY + 28 + row * spacing;
    
    // Verifica che l'elemento sia dentro la canvas
    if (x + itemWidth > width - margin) continue;
    
    // Calcola l'area cliccabile (larghezza completa dell'elemento, altezza basata su spacing)
    let itemHeight = spacing;
    let itemX = x;
    let itemY = y - 8; // Offset per centrare verticalmente
    
    // Salva le informazioni per il click detection
    window.typeLegendItems.push({
      type: type,
      x: itemX,
      y: itemY,
      width: itemWidth,
      height: itemHeight
    });
    
    // Verifica se il mouse è sopra questo elemento
    let isHovered = mouseX >= itemX && mouseX <= itemX + itemWidth &&
                    mouseY >= itemY && mouseY <= itemY + itemHeight;
    
    // Verifica se questo tipo è selezionato
    let isSelected = selectedType === type;
    
    // Evidenziazione per hover o selezione
    if (isHovered || isSelected) {
      // Sfondo evidenziato
      push();
      fill(50, 50, 60, isSelected ? 180 : 120);
      noStroke();
      rect(itemX - 5, itemY - 3, itemWidth + 10, itemHeight + 6, 4);
      pop();
      
      // Cambia il cursore a mano quando si passa sopra
      if (isHovered && !isSelected) {
        cursor(HAND);
      }
    }
    
    // Disegna il glifo con stile più elegante
    push();
    // Colore più intenso se selezionato
    let colGlyph = isSelected ? color(255, 180, 50) : color(190, 190, 200);
    fill(colGlyph);
    stroke(colGlyph);
    strokeWeight(isSelected ? 1.5 : 1.2);
    drawVolcanoGlyph(x + 10, y, type);
    pop();
    
    // Testo del tipo con migliore leggibilità
    fill(isSelected ? color(255, 220, 120) : color(230, 230, 240));
    noStroke();
    textStyle(isSelected ? BOLD : NORMAL);
    // Tronca il testo se è troppo lungo
    let displayType = type;
    let maxTextWidth = itemWidth - 30;
    if (textWidth(displayType) > maxTextWidth) {
      while (textWidth(displayType + "...") > maxTextWidth && displayType.length > 0) {
        displayType = displayType.substring(0, displayType.length - 1);
      }
      displayType += "...";
    }
    text(displayType, x + 22, y + 4);
  }
  
  // Il cursore verrà gestito in draw() per evitare conflitti
}

// Funzione per disegnare la legenda
function drawLegend() {
  let legendY = 95; // Spazio per il titolo e le istruzioni con margine aumentato
  let legendWidth = 500;
  let legendHeight = 35;
  let legendX = width / 2 - legendWidth / 2; // Centrata orizzontalmente
  let padding = 20;
  let containerHeight = 80;
  
  // Sfondo semi-trasparente elegante per la legenda
  fill(25, 25, 32, 220);
  
  // Evidenziazione quando highlightLegends è true
  if (highlightLegends) {
    let pulse = sin(frameCount * 0.2) * 0.3 + 0.7; // Effetto pulsazione
    stroke(100, 150, 255, 200 * pulse); // Bordo blu pulsante
    strokeWeight(2);
  } else {
    stroke(70, 70, 80, 180);
    strokeWeight(1);
  }
  rect(legendX - padding, legendY - padding, legendWidth + padding * 2, containerHeight, 8);
  
  // Titolo della legenda - stile professionale migliorato
  textAlign(CENTER);
  textSize(13);
  fill(245, 245, 250);
  noStroke();
  textStyle(BOLD);
  text("Elevazione", width / 2, legendY - 5);
  
  // Sottotitolo più discreto
  textSize(10);
  fill(180, 180, 190);
  textStyle(NORMAL);
  text("Più scuro = maggiore elevazione", width / 2, legendY + 12);
  
  // Disegna la barra di colori graduata con bordi più definiti
  noStroke();
  for (let i = 0; i <= legendWidth; i++) {
    let normalized = i / legendWidth;
    let col = getColorByElevation(lerp(minElevation, maxElevation, normalized));
    fill(col);
    rect(legendX + i, legendY + 22, 1, legendHeight);
  }
  
  // Bordo della barra - stile più elegante
  stroke(120, 120, 130, 200);
  strokeWeight(1.5);
  noFill();
  rect(legendX - 0.5, legendY + 22 - 0.5, legendWidth + 1, legendHeight + 1, 3);
  
  // Linee indicatori per i valori
  stroke(150, 150, 160, 180);
  strokeWeight(1);
  line(legendX, legendY + 22 + legendHeight + 3, legendX, legendY + 22 + legendHeight + 8);
  line(legendX + legendWidth, legendY + 22 + legendHeight + 3, legendX + legendWidth, legendY + 22 + legendHeight + 8);
  
  // Etichette dei valori minimo e massimo - stile più professionale
  textAlign(CENTER);
  textSize(10);
  fill(200, 200, 210);
  noStroke();
  textStyle(NORMAL);
  text(nf(minElevation, 0, 0) + " m", legendX, legendY + 22 + legendHeight + 20);
  text(nf(maxElevation, 0, 0) + " m", legendX + legendWidth, legendY + 22 + legendHeight + 20);
}

// Funzione per disegnare il glifo del vulcano in base al tipo
function drawVolcanoGlyph(x, y, type) {
  push();
  translate(x, y);
  
  // Dimensioni base del glifo
  let size = 5;
  
  switch(type) {
    case 'Stratovolcano':
      // Triangolo (forma classica di vulcano)
      triangle(0, -size, -size, size, size, size);
      break;
      
    case 'Shield volcano':
      // Semicerchio piatto
      arc(0, 0, size * 2, size * 1.5, PI, 0);
      break;
      
    case 'Cinder cone':
      // Cono piccolo appuntito
      triangle(0, -size * 1.2, -size * 0.6, size, size * 0.6, size);
      break;
      
    case 'Caldera':
      // Cerchio vuoto (anello)
      noFill();
      strokeWeight(1.5);
      ellipse(0, 0, size * 2, size * 2);
      break;
      
    case 'Lava dome':
      // Cerchio pieno
      ellipse(0, 0, size * 1.8, size * 1.8);
      break;
      
    case 'Volcanic field':
      // Punto semplice
      ellipse(0, 0, size, size);
      break;
      
    case 'Fissure vent':
      // Linea orizzontale
      line(-size * 1.5, 0, size * 1.5, 0);
      break;
      
    case 'Maar':
      // Cerchio con punto centrale - usa stroke per il cerchio esterno
      noFill();
      ellipse(0, 0, size * 2, size * 2);
      // Punto centrale - riabilita fill e disabilita stroke
      // Il fill è già impostato correttamente dalla chiamata esterna
      noStroke();
      ellipse(0, 0, size * 0.5, size * 0.5);
      // Ripristina stroke per i casi successivi
      strokeWeight(1);
      break;
      
    case 'Tuff cone':
      // Cerchio con bordo spesso
      noFill();
      strokeWeight(2);
      ellipse(0, 0, size * 1.8, size * 1.8);
      break;
      
    case 'Pyroclastic cone':
      // Stella a 4 punte
      beginShape();
      for (let i = 0; i < 8; i++) {
        let angle = (i * TWO_PI) / 8;
        let r = (i % 2 === 0) ? size * 1.2 : size * 0.6;
        vertex(r * cos(angle), r * sin(angle));
      }
      endShape(CLOSE);
      break;
      
    case 'Pumice cone':
      // Rombo
      beginShape();
      vertex(0, -size);
      vertex(size * 0.8, 0);
      vertex(0, size);
      vertex(-size * 0.8, 0);
      endShape(CLOSE);
      break;
      
    case 'Complex volcano':
      // Forma composita (triangolo con base larga)
      triangle(0, -size * 1.2, -size * 1.2, size, size * 1.2, size);
      // Piccolo cerchio sopra
      ellipse(0, -size * 1.2, size * 0.8, size * 0.8);
      break;
      
    case 'Submarine volcano':
      // Forma ondulata (onda)
      beginShape();
      curveVertex(-size * 1.5, 0);
      curveVertex(-size * 1.5, 0);
      curveVertex(-size * 0.75, -size * 0.5);
      curveVertex(0, 0);
      curveVertex(size * 0.75, size * 0.5);
      curveVertex(size * 1.5, 0);
      curveVertex(size * 1.5, 0);
      endShape();
      break;
      
    case 'Fumarole field':
      // Croce
      line(-size, 0, size, 0);
      line(0, -size, 0, size);
      break;
      
    case 'Scoria cone':
      // Quadrato
      rectMode(CENTER);
      rect(0, 0, size * 1.6, size * 1.6);
      break;
      
    case 'Scoria cones':
      // Quadrato ruotato (diamante)
      rectMode(CENTER);
      push();
      rotate(PI / 4);
      rect(0, 0, size * 1.6, size * 1.6);
      pop();
      break;
      
    case 'Pyroclastic cones':
      // Stella a 3 punte
      beginShape();
      for (let i = 0; i < 6; i++) {
        let angle = (i * TWO_PI) / 6 - HALF_PI;
        let r = (i % 2 === 0) ? size * 1.2 : size * 0.6;
        vertex(r * cos(angle), r * sin(angle));
      }
      endShape(CLOSE);
      break;
      
    case 'Explosion crater':
      // Anello con bordo esterno
      noFill();
      strokeWeight(1.5);
      ellipse(0, 0, size * 2.2, size * 2.2);
      ellipse(0, 0, size * 1.4, size * 1.4);
      break;
      
    case 'Cinder cones':
      // Triangolo invertito
      triangle(0, size, -size, -size, size, -size);
      break;
      
    case 'Compound volcano':
      // Due triangoli sovrapposti
      triangle(0, -size * 0.8, -size * 0.8, size * 0.8, size * 0.8, size * 0.8);
      triangle(0, size * 0.8, -size * 0.5, -size * 0.5, size * 0.5, -size * 0.5);
      break;
      
    case 'Cone':
      // Cono semplice appuntito
      triangle(0, -size * 1.5, -size * 0.5, size, size * 0.5, size);
      break;
      
    case 'Crater rows':
      // Tre punti in fila orizzontale
      ellipse(-size * 0.8, 0, size * 0.6, size * 0.6);
      ellipse(0, 0, size * 0.6, size * 0.6);
      ellipse(size * 0.8, 0, size * 0.6, size * 0.6);
      break;
      
    case 'Fissure vents':
      // Due linee parallele orizzontali
      line(-size * 1.5, -size * 0.3, size * 1.5, -size * 0.3);
      line(-size * 1.5, size * 0.3, size * 1.5, size * 0.3);
      break;
      
    case 'Hydrothermal field':
      // Esagono
      beginShape();
      for (let i = 0; i < 6; i++) {
        let angle = (i * TWO_PI) / 6;
        vertex(size * 1.2 * cos(angle), size * 1.2 * sin(angle));
      }
      endShape(CLOSE);
      break;
      
    case 'Lava cone':
      // Triangolo con base stretta
      triangle(0, -size * 1.3, -size * 0.4, size * 0.8, size * 0.4, size * 0.8);
      break;
      
    case 'Lava domes':
      // Due cerchi sovrapposti
      ellipse(-size * 0.4, 0, size * 1.2, size * 1.2);
      ellipse(size * 0.4, 0, size * 1.2, size * 1.2);
      break;
      
    case 'Mud volcano':
      // Forma a goccia
      beginShape();
      vertex(0, -size * 1.2);
      bezierVertex(size * 0.8, -size * 0.6, size * 0.8, size * 0.6, 0, size * 1.2);
      bezierVertex(-size * 0.8, size * 0.6, -size * 0.8, -size * 0.6, 0, -size * 1.2);
      endShape(CLOSE);
      break;
      
    case 'Not Volcanic':
      // X (cancellato)
      line(-size * 1.2, -size * 1.2, size * 1.2, size * 1.2);
      line(size * 1.2, -size * 1.2, -size * 1.2, size * 1.2);
      break;
      
    case 'Pyroclastic shield':
      // Semicerchio con base
      arc(0, 0, size * 2.2, size * 1.8, PI, 0);
      line(-size * 1.1, 0, size * 1.1, 0);
      break;
      
    case 'Shield':
      // Semicerchio semplice
      arc(0, 0, size * 2, size * 1.2, PI, 0);
      break;
      
    case 'Shield volcanoes':
      // Due semicerchi
      arc(-size * 0.5, 0, size * 1.2, size * 1, PI, 0);
      arc(size * 0.5, 0, size * 1.2, size * 1, PI, 0);
      break;
      
    case 'Somma volcano':
      // Doppio anello
      noFill();
      ellipse(0, 0, size * 2.4, size * 2.4);
      ellipse(0, 0, size * 1.6, size * 1.6);
      break;
      
    case 'Stratovolcano(es)':
    case 'Stratovolcanoes':
      // Due triangoli affiancati
      triangle(-size * 0.6, -size, -size * 1.2, size, 0, size);
      triangle(size * 0.6, -size, 0, size, size * 1.2, size);
      break;
      
    case 'Subglacial volcano':
      // Triangolo con linea ondulata alla base
      triangle(0, -size * 1.2, -size, size, size, size);
      noFill();
      beginShape();
      for (let x = -size; x <= size; x += size * 0.3) {
        let y = size + sin(x * 2) * size * 0.3;
        vertex(x, y);
      }
      endShape();
      break;
      
    case 'Submarine':
    case 'Submarine volcano?':
    case 'Submarine volcanoes':
      // Forma ondulata doppia
      beginShape();
      curveVertex(-size * 1.5, 0);
      curveVertex(-size * 1.5, 0);
      curveVertex(-size * 0.75, -size * 0.6);
      curveVertex(0, 0);
      curveVertex(size * 0.75, size * 0.6);
      curveVertex(size * 1.5, 0);
      curveVertex(size * 1.5, 0);
      endShape();
      beginShape();
      curveVertex(-size * 1.5, size * 0.5);
      curveVertex(-size * 1.5, size * 0.5);
      curveVertex(-size * 0.75, size * 1.1);
      curveVertex(0, size * 0.5);
      curveVertex(size * 0.75, size * -0.1);
      curveVertex(size * 1.5, size * 0.5);
      curveVertex(size * 1.5, size * 0.5);
      endShape();
      break;
      
    case 'Tuff rings':
      // Anelli multipli
      noFill();
      ellipse(0, 0, size * 2.2, size * 2.2);
      ellipse(0, 0, size * 1.5, size * 1.5);
      ellipse(0, 0, size * 0.8, size * 0.8);
      break;
      
    case 'Unknown':
      // Punto interrogativo stilizzato
      noFill();
      arc(0, -size * 0.3, size * 0.8, size * 0.8, 0, PI);
      line(0, 0, 0, size * 0.6);
      fill(0);
      ellipse(0, size * 1.1, size * 0.3, size * 0.3);
      break;
      
    case 'Volcanic complex':
      // Forma composita a 3 elementi
      ellipse(-size * 0.8, -size * 0.3, size * 1, size * 1);
      ellipse(size * 0.8, -size * 0.3, size * 1, size * 1);
      triangle(0, size * 0.7, -size * 0.6, -size * 0.1, size * 0.6, -size * 0.1);
      break;
      
    default:
      // Forma di default: cerchio con punto centrale
      ellipse(0, 0, size * 1.5, size * 1.5);
      ellipse(0, 0, size * 0.4, size * 0.4);
      break;
  }
  
  pop();
}

// Funzione per mappare coordinate geografiche a coordinate schermo nel riquadro
function geoToScreen(lon, lat) {
  let x = map(lon, minLon, maxLon, boxX, boxX + boxWidth);
  let y = map(lat, maxLat, minLat, boxY, boxY + boxHeight);
  return {x: x, y: y};
}

// Funzione per mappare coordinate globali a coordinate schermo (per il planisfero)
function worldGeoToScreen(lon, lat) {
  let worldMinLon = -180;
  let worldMaxLon = 180;
  let worldMinLat = -85;
  let worldMaxLat = 85;
  let x = map(lon, worldMinLon, worldMaxLon, boxX, boxX + boxWidth);
  let y = map(lat, worldMaxLat, worldMinLat, boxY, boxY + boxHeight);
  return {x: x, y: y};
}

// Funzione per disegnare una mappa del mondo stilizzata minimalista (line art)
function drawWorldMap() {
  push();
  
  // Stile line art minimalista: solo contorni sottili, nessun riempimento
  noFill();
  stroke(80, 85, 95, 120); // Colore grigio chiaro e sottile per non sovrastare i vulcani
  strokeWeight(0.8);
  
  // Helper function per disegnare continenti con forme semplificate e curve smooth
  function drawContinent(points) {
    beginShape();
    for (let i = 0; i < points.length; i++) {
      let p = points[i];
      let pt = worldGeoToScreen(p[0], p[1]);
      // Permetti punti anche leggermente fuori dal box per continenti che si estendono
      if (pt.x >= boxX - 200 && pt.x <= boxX + boxWidth + 200 && pt.y >= boxY - 200 && pt.y <= boxY + boxHeight + 200) {
        if (i === 0 || i === points.length - 1) {
          vertex(pt.x, pt.y);
        } else {
          curveVertex(pt.x, pt.y);
        }
      }
    }
    endShape(CLOSE);
  }
  
  // Helper per isole e piccole forme stilizzate
  function drawIsland(points) {
    beginShape();
    for (let i = 0; i < points.length; i++) {
      let p = points[i];
      let pt = worldGeoToScreen(p[0], p[1]);
      if (pt.x >= boxX - 50 && pt.x <= boxX + boxWidth + 50 && pt.y >= boxY - 50 && pt.y <= boxY + boxHeight + 50) {
        if (i === 0 || i === points.length - 1) {
          vertex(pt.x, pt.y);
        } else {
          curveVertex(pt.x, pt.y);
        }
      }
    }
    endShape(CLOSE);
  }
  
  // Nord America - forma stilizzata semplificata
  drawContinent([
    [-170, 70], [-130, 65], [-100, 52], [-85, 45], [-80, 40],
    [-77, 35], [-77, 30], [-80, 26], [-85, 25], [-95, 26],
    [-105, 28], [-115, 32], [-125, 38], [-130, 45], [-135, 55],
    [-140, 62], [-155, 66], [-170, 68]
  ]);
  
  // Sud America - forma stilizzata (stretta e allungata)
  drawContinent([
    [-70, 12], [-68, 5], [-66, -5], [-67, -15], [-69, -25],
    [-72, -35], [-75, -43], [-76, -52], [-75, -54], [-73, -50],
    [-70, -40], [-69, -28], [-69, -15], [-69, -3], [-70, 8]
  ]);
  
  // Europa - forma stilizzata
  drawContinent([
    [-10, 71], [-2, 70], [8, 65], [16, 60], [22, 54],
    [28, 48], [32, 42], [33, 36], [31, 30], [25, 28],
    [15, 29], [5, 31], [-5, 34], [-9, 40], [-10, 50],
    [-10, 60], [-10, 68]
  ]);
  
  // Africa - forma stilizzata caratteristica
  drawContinent([
    [-17, 37], [-10, 38], [0, 36], [10, 33], [20, 29],
    [28, 23], [33, 16], [34, 8], [33, 0], [30, -5],
    [25, -9], [15, -11], [5, -11], [-5, -10], [-15, -7],
    [-17, -2], [-17, 8], [-17, 18], [-17, 28]
  ]);
  
  // Asia - forma stilizzata
  drawContinent([
    [40, 73], [60, 71], [80, 67], [100, 61], [120, 53],
    [140, 43], [150, 33], [151, 23], [148, 15], [140, 11],
    [130, 10], [115, 12], [100, 16], [85, 23], [70, 32],
    [55, 42], [45, 52], [41, 62], [40, 70]
  ]);
  
  // Penisola indiana (India) - stilizzata
  drawIsland([
    [68, 34], [73, 23], [77, 11], [76, 8], [72, 12],
    [69, 18], [67, 26], [67, 31]
  ]);
  
  // Australia - forma stilizzata
  drawContinent([
    [113, -12], [125, -18], [135, -25], [143, -32], [143, -37],
    [140, -38], [132, -33], [125, -27], [118, -20], [114, -14]
  ]);
  
  // Groenlandia - stilizzata
  drawContinent([
    [-73, 60], [-60, 64], [-40, 64.5], [-28, 63], [-25, 60],
    [-28, 58], [-40, 57.5], [-60, 58.5], [-70, 60]
  ]);
  
  // Giappone - stilizzato
  drawIsland([
    [129, 32], [133, 36], [137, 36], [141, 33], [141, 30],
    [138, 28], [134, 27], [130, 29]
  ]);
  
  // Italia - stilizzata (stivale)
  drawIsland([
    [6, 44], [9, 43], [12, 41], [13, 40], [12, 39],
    [8, 37], [6, 37], [5, 39], [5, 42]
  ]);
  
  // Regno Unito - stilizzato
  drawIsland([
    [-8, 51], [-6, 52], [-2, 53], [-1, 54], [-3, 55],
    [-6, 54.5], [-8, 53], [-9, 52]
  ]);
  
  // Penisola iberica - stilizzata
  drawIsland([
    [-10, 40], [-7, 40], [-6, 42], [-7, 43], [-9, 44],
    [-10, 42]
  ]);
  
  // Indonesia/Malesia - stilizzata
  drawIsland([
    [95, 6], [105, 3], [115, 0], [119, -3], [118, -6],
    [111, -8], [102, -6], [96, -4], [95, 0]
  ]);
  
  // Madagascar - stilizzata
  drawIsland([
    [46, -12], [48, -14], [48, -16], [47, -18], [45, -18],
    [44, -16], [44, -13], [45, -12]
  ]);
  
  pop();
}

// Funzione per ottenere il colore in base all'elevazione
function getColorByElevation(elevation) {
  if (isNaN(elevation) || minElevation === maxElevation) {
    return color(200, 100, 50); // Colore di default se non ci sono dati
  }
  
  // Normalizza l'elevazione tra 0 e 1
  let normalized = map(elevation, minElevation, maxElevation, 0, 1);
  normalized = constrain(normalized, 0, 1);
  
  // Gradiente: arancione -> marrone
  // Arancione: rgb(255, 140, 0)
  // Marrone: rgb(101, 67, 33)
  
  // Interpolazione diretta da arancione a marrone
  let r = lerp(255, 101, normalized);
  let g = lerp(140, 67, normalized);
  let b = lerp(0, 33, normalized);
  
  return color(r, g, b);
}

function draw() {
  // Sfondo scuro elegante
  background(15, 15, 20);
  
  // Titolo professionale in alto
  textAlign(CENTER);
  textSize(32);
  fill(245, 245, 250);
  noStroke();
  textStyle(BOLD);
  text("Dataset: Volcanoes in the World", width / 2, 35);
  
  // Sottolineatura elegante sotto il titolo
  stroke(100, 150, 255, 180);
  strokeWeight(2);
  let titleWidth = textWidth("Dataset: Volcanoes in the World");
  line(width / 2 - titleWidth / 2 - 20, 43, width / 2 + titleWidth / 2 + 20, 43);
  noStroke();
  
  // Istruzione per l'interazione
  textAlign(CENTER);
  textSize(11);
  fill(180, 180, 190);
  noStroke();
  textStyle(NORMAL);
  let instructionText = "Clicca su un vulcano per visualizzarne le specifiche";
  if (selectedType) {
    instructionText = "Filtro attivo: " + selectedType + " | Clicca di nuovo sulla legenda per rimuovere il filtro";
    fill(255, 180, 50); // Colore arancione per indicare il filtro attivo
  }
  text(instructionText, width / 2, 70);
  
  // Disegna la legenda dell'elevazione in alto
  drawLegend();
  
  // Disegna la legenda dei tipi
  drawTypeLegend();
  
  // Assicurati che boxX e boxY siano definiti
  if (typeof boxX === 'undefined' || typeof boxY === 'undefined') {
    boxX = (width - boxWidth) / 2;
    boxY = 350;
  }
  
  // Disegna il riquadro con sfondo scuro elegante e bordo sottile
  fill(22, 22, 28);
  stroke(70, 70, 80);
  strokeWeight(2);
  rect(boxX, boxY, boxWidth, boxHeight, 6);
  
  // Ombra interna sottile per profondità
  noFill();
  stroke(10, 10, 15);
  strokeWeight(1);
  rect(boxX + 1, boxY + 1, boxWidth - 2, boxHeight - 2, 6);
  
  // Disegna i glifi per ogni vulcano alle coordinate geografiche (lat/lon mappate)
  // con colori basati sull'elevazione
  for (let volcano of volcanoes) {
    // Filtra in base al tipo selezionato nella legenda
    if (selectedType !== null && volcano.type !== selectedType) {
      continue; // Salta questo vulcano se non corrisponde al tipo selezionato
    }
    
    // Verifica che il vulcano sia dentro il riquadro
    if (volcano.x >= boxX && volcano.x <= boxX + boxWidth &&
        volcano.y >= boxY && volcano.y <= boxY + boxHeight) {
      
      // Colore basato sull'elevazione (da rosso chiaro a marrone scuro)
      let col = getColorByElevation(volcano.elevation);
      fill(col);
      stroke(col);
      strokeWeight(1);
      
      // Disegna il glifo unico in base al tipo di vulcano
      // alle coordinate mappate da lat/lon
      if (volcano.type) {
        // Evidenzia il vulcano selezionato
        if (volcano === selectedVolcano) {
          push();
          strokeWeight(2.5);
          stroke(255, 180, 50); // Bordo arancione/ambra per il selezionato su sfondo scuro
          drawVolcanoGlyph(volcano.x, volcano.y, volcano.type);
          pop();
        } else {
          drawVolcanoGlyph(volcano.x, volcano.y, volcano.type);
        }
      }
    }
  }
  
  // Disegna la legenda con i dati del vulcano selezionato
  if (selectedVolcano) {
    drawVolcanoInfo(selectedVolcano);
  }
  
  // Disegna il footer
  drawFooter();
  
  // Gestisce l'evidenziazione delle legende
  if (highlightLegends) {
    highlightTimer--;
    if (highlightTimer <= 0) {
      highlightLegends = false;
    }
  }
}

// Funzione per disegnare il footer
function drawFooter() {
  let footerHeight = 40;
  let footerY = height - footerHeight;
  
  // Sfondo del footer
  fill(25, 25, 32, 240);
  stroke(70, 70, 80, 200);
  strokeWeight(1);
  rect(0, footerY, width, footerHeight);
  
  // Linea superiore del footer
  stroke(90, 90, 100, 150);
  strokeWeight(1);
  line(0, footerY, width, footerY);
  noStroke();
  
  // Testo del footer (cliccabile)
  textAlign(CENTER);
  textSize(12);
  fill(200, 200, 210);
  textStyle(NORMAL);
  
  // Verifica se il mouse è sopra il footer per cambiare il colore
  if (mouseY >= footerY && mouseY <= height) {
    fill(240, 240, 250);
    cursor(HAND);
  }
  
  text("Torna alle legende", width / 2, footerY + footerHeight / 2 + 4);
  
  // Icona freccia o indicatore
  fill(180, 180, 190);
  triangle(width / 2 - 60, footerY + footerHeight / 2 - 5, 
           width / 2 - 60, footerY + footerHeight / 2 + 5,
           width / 2 - 75, footerY + footerHeight / 2);
}

// Funzione per rilevare il click su un vulcano
function mousePressed() {
  let footerHeight = 40;
  let footerY = height - footerHeight;
  
  // Controlla se il click è su un elemento della legenda dei tipi
  if (window.typeLegendItems) {
    for (let item of window.typeLegendItems) {
      if (mouseX >= item.x && mouseX <= item.x + item.width &&
          mouseY >= item.y && mouseY <= item.y + item.height) {
        // Se si clicca sullo stesso tipo, deseleziona (mostra tutti)
        if (selectedType === item.type) {
          selectedType = null;
        } else {
          // Altrimenti seleziona il nuovo tipo
          selectedType = item.type;
        }
        // Deseleziona il vulcano selezionato quando si cambia filtro
        selectedVolcano = null;
        return; // Non processare altri click
      }
    }
  }
  
  // Controlla se il click è sul footer
  if (mouseY >= footerY && mouseY <= height) {
    // Scrolla alla parte superiore della pagina e evidenzia le legende
    window.scrollTo({ top: 0, behavior: 'smooth' });
    highlightLegends = true;
    highlightTimer = 120; // Evidenzia per 120 frame (circa 2 secondi a 60fps)
    return; // Non processare altri click
  }
  
  selectedVolcano = null;
  
  // Controlla se il click è dentro il riquadro
  if (mouseX >= boxX && mouseX <= boxX + boxWidth &&
      mouseY >= boxY && mouseY <= boxY + boxHeight) {
    
    // Cerca il vulcano più vicino al punto del click
    let minDistance = Infinity;
    let closestVolcano = null;
    let clickRadius = 15; // Raggio di click in pixel
    
    for (let volcano of volcanoes) {
      if (volcano.x && volcano.y) {
        let distance = dist(mouseX, mouseY, volcano.x, volcano.y);
        if (distance < clickRadius && distance < minDistance) {
          minDistance = distance;
          closestVolcano = volcano;
        }
      }
    }
    
    if (closestVolcano) {
      selectedVolcano = closestVolcano;
    }
  }
}

// Funzione per disegnare le informazioni del vulcano selezionato
function drawVolcanoInfo(volcano) {
  let infoWidth = 250;
  let infoHeight = 180; // Aumentata per le ultime 3 colonne
  let padding = 12;
  let margin = 15;
  let offset = 0; // Offset dalla posizione del vulcano
  
  // Calcola la posizione accanto al vulcano
  // Prova prima a destra
  let infoX = volcano.x + offset;
  let infoY = volcano.y - infoHeight / 2;
  
  // Se va fuori a destra, posiziona a sinistra
  if (infoX + infoWidth > width - margin) {
    infoX = volcano.x - infoWidth - offset;
  }
  
  // Se va fuori a sinistra, posiziona in alto o in basso
  if (infoX < margin) {
    infoX = volcano.x - infoWidth / 2;
    infoY = volcano.y - infoHeight - offset;
    
    // Se va fuori in alto, posiziona in basso
    if (infoY < margin) {
      infoY = volcano.y + offset;
    }
  }
  
  // Se va fuori in basso, posiziona in alto
  if (infoY + infoHeight > height - margin) {
    infoY = volcano.y - infoHeight - offset;
  }
  
  // Verifica finali che non vada fuori dai bordi
  if (infoX < margin) infoX = margin;
  if (infoY < margin) infoY = margin;
  if (infoX + infoWidth > width - margin) infoX = width - infoWidth - margin;
  if (infoY + infoHeight > height - margin) infoY = height - infoHeight - margin;
  
  // Sfondo semi-trasparente scuro elegante
  fill(32, 32, 38, 240);
  stroke(90, 90, 100, 220);
  strokeWeight(1.5);
  rect(infoX, infoY, infoWidth, infoHeight, 8); // Angoli arrotondati
  
  // Ombra sottile per profondità
  fill(10, 10, 15, 180);
  noStroke();
  rect(infoX + 2, infoY + 2, infoWidth, infoHeight, 8);
  
  // Titolo - testo chiaro
  fill(245, 245, 250);
  noStroke();
  textAlign(LEFT);
  textSize(13);
  textStyle(BOLD);
  text("Vulcano Selezionato", infoX + padding, infoY + 18);
  
  // Linea separatrice elegante
  stroke(100, 100, 110, 200);
  strokeWeight(1);
  line(infoX + padding, infoY + 25, infoX + infoWidth - padding, infoY + 25);
  noStroke();
  
  // Dati delle prime 3 colonne
  textStyle(NORMAL);
  textSize(10);
  
  // Volcano Number
  fill(160, 160, 170);
  text("Numero:", infoX + padding, infoY + 42);
  fill(240, 240, 250);
  let numText = volcano.volcanoNumber || "N/A";
  if (numText.length > 18) {
    numText = numText.substring(0, 15) + "...";
  }
  text(numText, infoX + padding + 65, infoY + 42);
  
  // Volcano Name
  fill(160, 160, 170);
  text("Nome:", infoX + padding, infoY + 58);
  fill(240, 240, 250);
  let name = volcano.volcanoName || "N/A";
  // Tronca il nome se è troppo lungo
  if (name.length > 18) {
    name = name.substring(0, 15) + "...";
  }
  text(name, infoX + padding + 65, infoY + 58);
  
  // Country
  fill(160, 160, 170);
  text("Paese:", infoX + padding, infoY + 74);
  fill(240, 240, 250);
  let country = volcano.country || "N/A";
  // Tronca il paese se è troppo lungo
  if (country.length > 18) {
    country = country.substring(0, 15) + "...";
  }
  text(country, infoX + padding + 65, infoY + 74);
  
  // Tipo di vulcano
  fill(160, 160, 170);
  text("Tipo:", infoX + padding, infoY + 90);
  fill(240, 240, 250);
  let type = volcano.type || "N/A";
  if (type.length > 18) {
    type = type.substring(0, 15) + "...";
  }
  text(type, infoX + padding + 65, infoY + 90);
  
  // Linea separatrice per le ultime 3 colonne
  stroke(100, 100, 110, 200);
  strokeWeight(1);
  line(infoX + padding, infoY + 108, infoX + infoWidth - padding, infoY + 108);
  noStroke();
  
  // Ultime 3 colonne
  // TypeCategory
  fill(160, 160, 170);
  text("Categoria:", infoX + padding, infoY + 126);
  fill(240, 240, 250);
  let typeCat = volcano.typeCategory || "N/A";
  if (typeCat.length > 18) {
    typeCat = typeCat.substring(0, 15) + "...";
  }
  text(typeCat, infoX + padding + 65, infoY + 126);
  
  // Status
  fill(160, 160, 170);
  text("Stato:", infoX + padding, infoY + 142);
  fill(240, 240, 250);
  let status = volcano.status || "N/A";
  if (status.length > 18) {
    status = status.substring(0, 15) + "...";
  }
  text(status, infoX + padding + 65, infoY + 142);
  
  // Last Known Eruption
  fill(160, 160, 170);
  text("Ultima eruzione:", infoX + padding, infoY + 158);
  fill(240, 240, 250);
  let lastEruption = volcano.lastKnownEruption || "N/A";
  if (lastEruption.length > 15) {
    lastEruption = lastEruption.substring(0, 12) + "...";
  }
  text(lastEruption, infoX + padding + 85, infoY + 158);
  
  // Istruzione per chiudere (discreta)
  fill(140, 140, 150);
  textSize(8);
  text("Click per deselezionare", infoX + padding, infoY + infoHeight - 6);
}
