document.addEventListener("DOMContentLoaded", function () {
    
    // Espera até que o navegador esteja pronto para renderizar o jogo (evita falhas)
    window.requestAnimationFrame(function () {
      let manager = new GameManager(4, KeyboardInputManager, HTMLActuator);
    });
  });
  
  function GameManager(size, InputManager, Actuator) {
    this.size = size; // Tamanho do GRID
    this.inputManager = new InputManager;
    this.actuator = new Actuator;
  
    this.startTiles = 2;
  
    this.inputManager.on("move", this.move.bind(this));
    this.inputManager.on("restart", this.restart.bind(this));
  
    this.setup();
  }
  
  // Reinicia o jogo
  GameManager.prototype.restart = function () {
    this.actuator.restart();
    this.setup();
  };
  
  // Configura o jogo
  GameManager.prototype.setup = function () {
    this.grid = new Grid(this.size);
  
    this.score = 0;
    this.over = false;
    this.won = false;
  
    // Adiciona os blocos iniciais
    this.addStartTiles();
  
    // Atualiza o atuador
    this.actuate();
  };
  
  // Configura as peças iniciais para começar o jogo
  GameManager.prototype.addStartTiles = function () {
    for (let i = 0; i < this.startTiles; i++) {
      this.addRandomTile();
    }
  };
  
  // Adiciona uma peça em uma posição aleatória
  GameManager.prototype.addRandomTile = function () {
    if (this.grid.cellsAvailable()) {
      let value = Math.random() < 0.9 ? 2 : 4;
      let tile = new Tile(this.grid.randomAvailableCell(), value);
  
      this.grid.insertTile(tile);
    }
  };
  
  // Envia a grade atualizada para o atuador
  GameManager.prototype.actuate = function () {
    this.actuator.actuate(this.grid, {
      score: this.score,
      over: this.over,
      won: this.won
    });
  };
  
  // Salva todas as posições dos blocos e remove as informações de fusão
  GameManager.prototype.prepareTiles = function () {
    this.grid.eachCell(function (x, y, tile) {
      if (tile) {
        tile.mergedFrom = null;
        tile.savePosition();
      }
    });
  };
  
  // Move um ladrilho e sua representação
  GameManager.prototype.moveTile = function (tile, cell) {
    this.grid.cells[tile.x][tile.y] = null;
    this.grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
  };
  
  // Move ladrilhos na grade na direção especificada
  GameManager.prototype.move = function (direction) {
    let self = this;
  
    if (this.over || this.won) return;
  
    let cell, tile;
  
    let vector = this.getVector(direction);
    let traversals = this.buildTraversals(vector);
    let moved = false;
  
    // Salva as posições atuais dos blocos e remova as informações de fusão
    this.prepareTiles();
  
    // Atravessa a grade na direção certa e mova as peças
    traversals.x.forEach(function (x) {
      traversals.y.forEach(function (y) {
        cell = { x: x, y: y };
        tile = self.grid.cellContent(cell);
  
        if (tile) {
          let positions = self.findFarthestPosition(cell, vector);
          let next = self.grid.cellContent(positions.next);
  
          // Apenas uma fusão
          if (next && next.value === tile.value && !next.mergedFrom) {
            let merged = new Tile(positions.next, tile.value * 2);
            merged.mergedFrom = [tile, next];
  
            self.grid.insertTile(merged);
            self.grid.removeTile(tile);
  
            // Converte as posições das duas peças
            tile.updatePosition(positions.next);
  
            // Atualiza a pontuação
            self.score += merged.value;
  
            // Bloco 2048
            if (merged.value === 2048) self.won = true;
          } else {
            self.moveTile(tile, positions.farthest);
          }
  
          if (!self.positionsEqual(cell, tile)) {
            moved = true; // Muda de sua célula original
          }
        }
      });
    });
  
    if (moved) {
      this.addRandomTile();
  
      if (!this.movesAvailable()) {
        this.over = true; // Game over!
      }
  
      this.actuate();
    }
  };
  
  // Obtem o vetor que representa a direção escolhida
  GameManager.prototype.getVector = function (direction) {
    // Vetores que representam o movimento dos ladrilhos
    let map = {
      0: { x: 0,  y: -1 }, // Pra cima
      1: { x: 1,  y: 0 },  // Pra direita
      2: { x: 0,  y: 1 },  // Pra baixo
      3: { x: -1, y: 0 }   // Pra esquerda
    };
  
    return map[direction];
  };
  
  // Constroi uma lista de posições para percorrer na ordem certa
  GameManager.prototype.buildTraversals = function (vector) {
    let traversals = { x: [], y: [] };
  
    for (let pos = 0; pos < this.size; pos++) {
      traversals.x.push(pos);
      traversals.y.push(pos);
    }
  
    // Sempre atravesse da célula mais distante na direção escolhida
    if (vector.x === 1) traversals.x = traversals.x.reverse();
    if (vector.y === 1) traversals.y = traversals.y.reverse();
  
    return traversals;
  };
  
  GameManager.prototype.findFarthestPosition = function (cell, vector) {
    let previous;
  
    // Progride na direção do vetor até que um obstáculo seja encontrado
    do {
      previous = cell;
      cell = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (this.grid.withinBounds(cell) &&
             this.grid.cellAvailable(cell));
  
    return {
      farthest: previous,
      next: cell // Verifica se uma mesclagem é necessária
    };
  };
  
  GameManager.prototype.movesAvailable = function () {
    return this.grid.cellsAvailable() || this.tileMatchesAvailable();
  };
  
  // Verifica se há correspondências disponíveis entre as peças
  GameManager.prototype.tileMatchesAvailable = function () {
    let self = this;
  
    let tile;
  
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        tile = this.grid.cellContent({ x: x, y: y });
  
        if (tile) {
          for (let direction = 0; direction < 4; direction++) {
            let vector = self.getVector(direction);
            let cell = { x: x + vector.x, y: y + vector.y };
  
            let other = self.grid.cellContent(cell);
            if (other) {
            }
  
            if (other && other.value === tile.value) {
              return true; // Essas duas peças podem ser mescladas
            }
          }
        }
      }
    }
  
    return false;
  };
  
  GameManager.prototype.positionsEqual = function (first, second) {
    return first.x === second.x && first.y === second.y;
  };
  
  function Grid(size) {
    this.size = size;
  
    this.cells = [];
  
    this.build();
  }
  
  // Constroi uma grade do tamanho especificado
  Grid.prototype.build = function () {
    for (let x = 0; x < this.size; x++) {
      let row = this.cells[x] = [];
  
      for (let y = 0; y < this.size; y++) {
        row.push(null);
      }
    }
  };
  
  // Encontra a primeira posição aleatória disponível
  Grid.prototype.randomAvailableCell = function () {
    let cells = this.availableCells();
  
    if (cells.length) {
      return cells[Math.floor(Math.random() * cells.length)];
    }
  };
  
  Grid.prototype.availableCells = function () {
    let cells = [];
  
    this.eachCell(function (x, y, tile) {
      if (!tile) {
        cells.push({ x: x, y: y });
      }
    });
  
    return cells;
  };
  
  // Chama o retorno para cada célula
  Grid.prototype.eachCell = function (callback) {
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        callback(x, y, this.cells[x][y]);
      }
    }
  };
  
  // Verifica se há alguma célula disponível
  Grid.prototype.cellsAvailable = function () {
    return !!this.availableCells().length;
  };
  
  // Verifica se a célula especificada é usada
  Grid.prototype.cellAvailable = function (cell) {
    return !this.cellOccupied(cell);
  };
  
  Grid.prototype.cellOccupied = function (cell) {
    return !!this.cellContent(cell);
  };
  
  Grid.prototype.cellContent = function (cell) {
    if (this.withinBounds(cell)) {
      return this.cells[cell.x][cell.y];
    } else {
      return null;
    }
  };
  
  // Insere um bloco em sua posição
  Grid.prototype.insertTile = function (tile) {
    this.cells[tile.x][tile.y] = tile;
  };
  
  Grid.prototype.removeTile = function (tile) {
    this.cells[tile.x][tile.y] = null;
  };
  
  Grid.prototype.withinBounds = function (position) {
    return position.x >= 0 && position.x < this.size &&
           position.y >= 0 && position.y < this.size;
  };
  
  function HTMLActuator() {
    this.tileContainer = document.getElementsByClassName("tile-container")[0];
    this.scoreContainer = document.getElementsByClassName("score-container")[0];
    this.messageContainer = document.getElementsByClassName("game-message")[0];
  
    this.score = 0;
  }
  
  HTMLActuator.prototype.actuate = function (grid, metadata) {
    let self = this;
  
    window.requestAnimationFrame(function () {
      self.clearContainer(self.tileContainer);
  
      grid.cells.forEach(function (column) {
        column.forEach(function (cell) {
          if (cell) {
            self.addTile(cell);
          }
        });
      });
  
      self.updateScore(metadata.score);
  
      if (metadata.over) self.message(false); // Você perdeu
      if (metadata.won) self.message(true); // Você ganhou
    });
  };
  
  HTMLActuator.prototype.restart = function () {
    this.clearMessage();
  };
  
  HTMLActuator.prototype.clearContainer = function (container) {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  };
  
  HTMLActuator.prototype.addTile = function (tile) {
    let self = this;
  
    let element = document.createElement("div");
    let position = tile.previousPosition || { x: tile.x, y: tile.y };
    positionClass = this.positionClass(position);
  
    // Não podemos usar classlist porque, de alguma forma, falha ao substituir classes
    let classes = ["tile", "tile-" + tile.value, positionClass];
    this.applyClasses(element, classes);
  
    element.textContent = tile.value;
  
    if (tile.previousPosition) {
      // Certifica se a peça seja renderizada na posição anterior primeiro
      window.requestAnimationFrame(function () {
        classes[2] = self.positionClass({ x: tile.x, y: tile.y });
        self.applyClasses(element, classes); // Atualiza a posição
      });
    } else if (tile.mergedFrom) {
      classes.push("tile-merged");
      this.applyClasses(element, classes);
  
      // Renderi os ladrilhos que se fundiram
      tile.mergedFrom.forEach(function (merged) {
        self.addTile(merged);
      });
    } else {
      classes.push("tile-new");
      this.applyClasses(element, classes);
    }
  
    // Coloca a peça no tabuleiro
    this.tileContainer.appendChild(element);
  };
  
  HTMLActuator.prototype.applyClasses = function (element, classes) {
    element.setAttribute("class", classes.join(" "));
  };
  
  HTMLActuator.prototype.normalizePosition = function (position) {
    return { x: position.x + 1, y: position.y + 1 };
  };
  
  HTMLActuator.prototype.positionClass = function (position) {
    position = this.normalizePosition(position);
    return "tile-position-" + position.x + "-" + position.y;
  };
  
  HTMLActuator.prototype.updateScore = function (score) {
    this.clearContainer(this.scoreContainer);
  
    let difference = score - this.score;
    this.score = score;
  
    this.scoreContainer.textContent = this.score;
  
    if (difference > 0) {
      let addition = document.createElement("div");
      addition.classList.add("score-addition");
      addition.textContent = "+" + difference;
  
      this.scoreContainer.appendChild(addition);
    }
  };
  
  HTMLActuator.prototype.message = function (won) {
    let type = won ? "game-won" : "game-over";
    let message = won ? "You win!" : "Game over!"
    this.messageContainer.classList.add(type);
    this.messageContainer.getElementsByTagName("p")[0].textContent = message;
  };
  
  HTMLActuator.prototype.clearMessage = function () {
    this.messageContainer.classList.remove("game-won", "game-over");
  };
  
  function KeyboardInputManager() {
    this.events = {};
  
    this.listen();
  }
  
  KeyboardInputManager.prototype.on = function (event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  };
  
  KeyboardInputManager.prototype.emit = function (event, data) {
    let callbacks = this.events[event];
    if (callbacks) {
      callbacks.forEach(function (callback) {
        callback(data);
      });
    }
  };
  
  KeyboardInputManager.prototype.listen = function () {
    let self = this;
  
    let map = {
      38: 0, // Pra cima
      39: 1, // Pra direita
      40: 2, // Pra baixo
      37: 3, // Pra esquerda
      75: 0, 
      76: 1,
      74: 2,
      72: 3
    };
  
    document.addEventListener("keydown", function (event) {
      let modifiers = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
      let mapped = map[event.which];
  
      if (!modifiers) {
        if (mapped !== undefined) {
          event.preventDefault();
          self.emit("move", mapped);
        }
  
        if (event.which === 32) self.restart.bind(self)(event);
      }
    });
  
    let retry = document.getElementsByClassName("retry-button")[0];
    retry.addEventListener("click", this.restart.bind(this));
  
    // Eventos de deslize
    let gestures = [Hammer.DIRECTION_UP, Hammer.DIRECTION_RIGHT,
                    Hammer.DIRECTION_DOWN, Hammer.DIRECTION_LEFT];
  
    let gameContainer = document.getElementsByClassName("game-container")[0];
    let handler = Hammer(gameContainer, {
      drag_block_horizontal: true,
      drag_block_vertical: true
    });
  
    handler.on("swipe", function (event) {
      event.gesture.preventDefault();
      mapped = gestures.indexOf(event.gesture.direction);
  
      if (mapped !== -1) self.emit("move", mapped);
    });
  };
  
  KeyboardInputManager.prototype.restart = function (event) {
    event.preventDefault();
    this.emit("restart");
  };
  
  function Tile(position, value) {
    this.x = position.x;
    this.y = position.y;
    this.value = value || 2;
  
    this.previousPosition = null;
    this.mergedFrom = null; // Rastreia blocos que se uniram
  }
  
  Tile.prototype.savePosition = function () {
    this.previousPosition = { x: this.x, y: this.y };
  };
  
  Tile.prototype.updatePosition = function (position) {
    this.x = position.x;
    this.y = position.y;
  };