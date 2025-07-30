const placementBoard = document.getElementById("placement-board");
const shipSelection = document.getElementById("ship-selection");
const readyBtn = document.getElementById("ready-btn");
const currentPlayerLabel = document.getElementById("current-player-label");

const board1 = document.getElementById("board1");
const board2 = document.getElementById("board2");
const battleSection = document.getElementById("battle-section");
const battleStatus = document.getElementById("battle-status");
const score1 = document.getElementById("score1");
const score2 = document.getElementById("score2");
const victoryScreen = document.getElementById("victory-screen");
const victoryMessage = document.getElementById("victory-message");

let currentPlayer = 1;
let gamePhase = "placement";
let draggedShip = null;
let isGameOver = false;

const shipsToPlace = [4, 3, 3, 2, 2, 1, 1];
const playerBoards = {
  1: Array(100).fill(0),
  2: Array(100).fill(0),
};
const playerShips = {
  1: [],
  2: [],
};

const hitCounts = {
  1: 0,
  2: 0
};

function createCell(index, ownerBoard, forPlacement = false) {
  const cell = document.createElement("div");
  cell.classList.add("cell");
  cell.dataset.index = index;

  if (forPlacement) {
    cell.addEventListener("dragover", e => e.preventDefault());
    cell.addEventListener("drop", () => handlePlacementDrop(cell));
  } else {
    cell.addEventListener("click", () => handleShot(cell, ownerBoard));
  }

  return cell;
}

function createBoard(grid, ownerBoard, forPlacement = false) {
  grid.innerHTML = "";
  for (let i = 0; i < 100; i++) {
    const cell = createCell(i, ownerBoard, forPlacement);
    grid.appendChild(cell);
  }
}

function createShip(length) {
  const ship = document.createElement("div");
  ship.classList.add("ship");
  ship.dataset.length = length;
  ship.dataset.orientation = "horizontal";
  ship.setAttribute("draggable", true);
  ship.style.flexDirection = "row";

  for (let i = 0; i < length; i++) {
    const deck = document.createElement("div");
    deck.classList.add("deck");
    ship.appendChild(deck);
  }

  ship.addEventListener("click", () => {
    const o = ship.dataset.orientation === "horizontal" ? "vertical" : "horizontal";
    ship.dataset.orientation = o;
    ship.style.flexDirection = o === "horizontal" ? "row" : "column";
  });

  ship.addEventListener("dragstart", () => {
    draggedShip = ship;
  });

  return ship;
}

function fillShipSelection() {
  shipSelection.innerHTML = "";
  shipsToPlace.forEach(len => {
    const ship = createShip(len);
    shipSelection.appendChild(ship);
  });
}

function handlePlacementDrop(targetCell) {
  if (!draggedShip) return;
  const length = parseInt(draggedShip.dataset.length);
  const orientation = draggedShip.dataset.orientation;
  const index = parseInt(targetCell.dataset.index);
  const row = Math.floor(index / 10);
  const col = index % 10;

  const positions = [];
  for (let i = 0; i < length; i++) {
    let idx;
    if (orientation === "horizontal") {
      if (col + length > 10) return;
      idx = row * 10 + col + i;
    } else {
      if (row + length > 10) return;
      idx = (row + i) * 10 + col;
    }
    if (playerBoards[currentPlayer][idx] === 1) return;
    positions.push(idx);
  }

  positions.forEach(idx => {
    playerBoards[currentPlayer][idx] = 1;
    placementBoard.querySelector(`[data-index="${idx}"]`).classList.add("occupied");
  });

  playerShips[currentPlayer].push({ positions, hits: [] });
  draggedShip.remove();
  draggedShip = null;
}

function showPopup(text) {
  const popup = document.createElement("div");
  popup.textContent = text;
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.padding = "20px 30px";
  popup.style.backgroundColor = "#333";
  popup.style.color = "#fff";
  popup.style.fontSize = "18px";
  popup.style.borderRadius = "10px";
  popup.style.zIndex = 1000;
  document.body.appendChild(popup);
  setTimeout(() => document.body.removeChild(popup), 1200);
}

function startBattle() {
  gamePhase = "battle";
  document.getElementById("placement-section").style.display = "none";
  battleSection.style.display = "block";
  createBoard(board1, 1);
  createBoard(board2, 2);
  updateTurn();
}

function handleShot(cell, boardOwner) {
  if (isGameOver || gamePhase !== "battle") return;
  if (boardOwner === currentPlayer) return;

  const enemy = boardOwner;
  const index = parseInt(cell.dataset.index);
  if (cell.classList.contains("hit") || cell.classList.contains("miss")) return;

  if (playerBoards[enemy][index] === 1) {
    cell.classList.add("hit");
    showPopup("Trafiony!");
    hitCounts[currentPlayer]++;
    updateScore();
    registerHit(enemy, index);
    checkVictory(enemy);
  } else {
    cell.classList.add("miss");
    showPopup("Pudło!");
    currentPlayer = enemy;
    updateTurn();
  }
}

function updateScore() {
  score1.textContent = hitCounts[1];
  score2.textContent = hitCounts[2];
}

function registerHit(player, index) {
  for (let ship of playerShips[player]) {
    if (ship.positions.includes(index)) {
      ship.hits.push(index);
      if (ship.hits.length === ship.positions.length) {
        ship.positions.forEach(i => {
          const target = (player === 1 ? board1 : board2).querySelector(`[data-index="${i}"]`);
          if (target) target.style.backgroundColor = "#000";
        });
        showPopup("Zatopiony!");
      }
    }
  }
}

function checkVictory(player) {
  const allSunk = playerShips[player].every(ship => ship.hits.length === ship.positions.length);
  if (allSunk) {
    isGameOver = true;
    victoryScreen.style.display = "block";
    victoryMessage.textContent = `🎉 Gracz ${currentPlayer} wygrał! 🎉`;
    battleStatus.textContent = "Gra zakończona";
    board1.style.pointerEvents = "none";
    board2.style.pointerEvents = "none";
  }
}

function updateTurn() {
  battleStatus.textContent = `Tura: Gracz ${currentPlayer}`;
  board1.style.pointerEvents = currentPlayer === 2 ? "auto" : "none";
  board2.style.pointerEvents = currentPlayer === 1 ? "auto" : "none";
}

readyBtn.addEventListener("click", () => {
  if (currentPlayer === 1) {
    currentPlayer = 2;
    currentPlayerLabel.textContent = "Gracz 2: Rozmieść statki";
    fillShipSelection();
    createBoard(placementBoard, 2, true);
  } else {
    startBattle();
  }
});

// Запуск
fillShipSelection();
createBoard(placementBoard, 1, true);
