import React, { Component } from "react";
import Sprite, { Rect } from "./Sprite/index";
import SpriteMapper from "./SpriteMapper/index";

import "./style.css";

const initialPlayerPosition = 331;
const initialPlayerLeft = 80;
const groundPosition = 400;
const groundSpeed = 15;
const FPS = 30;

const gravityForce = 0.0025;
const jumpForce = 1.1;

const cactusSequences = [
  "smallCactus1",
  "smallCactus2",
  "smallCactus3",
  "bigCactus1",
  "bigCactus2",
  "bigCactus3"
];

const KEYCODES = {
  DOWN: 40,
  UP: 38,
  SPACE: 32
};

const cuts = [
  new Rect(0, 0, 75, 70),
  new Rect(75, 0, 90, 100),
  new Rect(165, 0, 95, 100),
  new Rect(260, 5, 90, 62),
  new Rect(350, 5, 90, 62),
  new Rect(440, 0, 40, 70),
  new Rect(480, 0, 68, 70),
  new Rect(548, 0, 100, 70),
  new Rect(648, 0, 55, 100),
  new Rect(703, 0, 100, 100),
  new Rect(803, 0, 150, 100),
  new Rect(953, 25, 385, 50),
  new Rect(1338, 0, 88, 100),
  new Rect(1426, 0, 88, 100),
  new Rect(1514, 0, 88, 100),
  new Rect(1602, 0, 88, 100),
  new Rect(1690, 0, 88, 100),
  new Rect(1778, 0, 88, 100),
  new Rect(1866, 40, 118, 50),
  new Rect(1984, 40, 118, 50),
  new Rect(2, 101, 99999999999, 30)
];

const sequences = {
  refreshButton: [0],
  iddle: [1],
  cloud: [2],
  flyingEnemy: [3, 3, 3, 4, 4, 4],
  smallCactus1: [5],
  smallCactus2: [6],
  smallCactus3: [7],
  bigCactus1: [8],
  bigCactus2: [9],
  bigCactus3: [10],
  gameOver: [11],
  iddle2: [12, 13],
  run: [14, 14, 14, 15, 15, 15],
  die: [16, 17],
  loweredRun: [18, 19],
  ground: [20]
};

class App extends Component {
  state = {
    dificult: 1,
    play: false,
    gameOver: false,
    activeSequence: "iddle",
    position: initialPlayerPosition,
    jumForce: 0,
    falling: false,
    score: 0,
    invertColor: false,
    cloud: [
      {
        speed: 5,
        x: 500,
        y: 230
      },
      {
        speed: 3,
        x: document.body.offsetWidth + 200,
        y: 310
      }
    ],
    cactus: [
      {
        sequence: "smallCactus1",
        x: 400,
        y: 355
      },
      {
        sequence: "smallCactus2",
        x: 800,
        y: 355
      },
      {
        sequence: "smallCactus3",
        x: 1200,
        y: 355
      }
    ],
    pterodactyl: {
      x: document.body.offsetWidth * (3 + Math.ceil(Math.random() * 10)),
      y: 280
    }
  };

  constructor(props) {
    super(props);
    this.setControls();
    setInterval(() => {
      const { play, dificult, score, invertColor } = this.state;
      if (!play) return;

      this.setState({
        ...(dificult.toFixed(3) % 2 === 0
          ? {
              invertColor: !invertColor
            }
          : {}),
        dificult: dificult + 0.005,
        score: Math.ceil(score + 0.01 * dificult)
      });
    }, 100);
  }

  setControls = () => {
    document.addEventListener("keydown", e => {
      const { play, jumForce, gameOver } = this.state;

      if (gameOver) {
        return window.location.reload();
      }

      switch (e.which) {
        case KEYCODES.SPACE:
        case KEYCODES.UP:
          if (!play) return this.play();
          if (jumForce === 0) {
            return this.jump();
          }
          return;
        case KEYCODES.DOWN:
          if (!play) return this.play();
          return this.lower();
        default:
          return;
      }
    });

    document.addEventListener("keyup", e => {
      switch (e.which) {
        case KEYCODES.DOWN:
          return this.run();
        default:
          return;
      }
    });
  };

  play = () => {
    const { play } = this.state;
    if (!play) {
      this.setState(
        {
          play: true,
          activeSequence: "run"
        },
        () => this.gravity()
      );
    }
  };

  jump = () => {
    this.setState({
      activeSequence: "iddle2",
      jumForce: -jumpForce
    });
  };

  lower = () => {
    this.setState({
      activeSequence: "loweredRun",
      position: Math.min(initialPlayerPosition + 42, this.state.position + 42)
    });
  };

  run = () => {
    this.setState({
      activeSequence: "run",
      falling: false,
      jumForce: 0,
      position: initialPlayerPosition
    });
  };

  gravity = () => {
    const { play, position, jumForce, falling } = this.state;

    const newPosition = position + jumForce * FPS;
    if (newPosition < initialPlayerPosition) {
      const newJumpForce = jumForce + gravityForce * FPS;
      this.setState({
        jumForce: newJumpForce,
        position: newPosition,
        falling: true
      });
    } else if (falling) {
      this.run();
    }

    if (play) requestAnimationFrame(this.gravity);
  };

  onCloudDisappear = cloudIndex => () => {
    const { cloud } = this.state;
    const cpCloud = JSON.parse(JSON.stringify(cloud));
    const currentClound = cpCloud[cloudIndex];

    currentClound.x = document.body.offsetWidth + Math.random() * 300;
    currentClound.y = 200 + Math.random() * 150;
    currentClound.speed = 1 + Math.random() * 6;
    cpCloud.splice(cloudIndex, 1, currentClound);

    this.setState({
      cloud: cpCloud
    });
  };

  onPterodactylDisappear = () => {
    const { pterodactyl } = this.state;
    const cpPterodactyl = JSON.parse(JSON.stringify(pterodactyl));

    cpPterodactyl.x =
      document.body.offsetWidth +
      Math.random() * document.body.offsetWidth * 10;
    cpPterodactyl.y = 200 + Math.random() * 5 * 20;

    this.setState({
      pterodactyl: cpPterodactyl
    });
  };

  onCactusDisappear = cactusIndex => () => {
    const { cactus } = this.state;
    const cpCactus = JSON.parse(JSON.stringify(cactus));
    const currentCactus = cpCactus[cactusIndex];
    const orderCactus = [...cpCactus].sort((a, b) => (a.x < b.x ? 1 : -1))[0];

    const randomIndex = Math.floor(Math.random() * cactusSequences.length);

    currentCactus.x = Math.max(
      document.body.offsetWidth,
      orderCactus.x + Math.random() * 200
    );
    currentCactus.sequence = cactusSequences[randomIndex];

    if (randomIndex > 2) {
      currentCactus.y = 325;
    } else {
      currentCactus.y = 355;
    }

    cpCactus.splice(cactusIndex, 1, currentCactus);

    this.setState({
      cactus: cpCactus
    });
  };

  gameOver = () => {
    if (this.state.play) {
      setTimeout(() => {
        this.setState({
          activeSequence: "die",
          gameOver: true,
          play: false
        });
      }, 0);
    }
  };

  render() {
    const {
      dificult,
      cloud,
      cactus,
      pterodactyl,
      play,
      activeSequence,
      position,
      gameOver,
      score,
      invertColor
    } = this.state;

    return (
      <div
        className="App"
        style={{
          filter: `invert(${+invertColor})`
        }}
      >
        <div className="sub-title">{score}</div>

        <SpriteMapper
          src="/images/t-rex-sprite.png"
          cuts={cuts}
          sequences={sequences}
          fps={FPS}
        >
          {cloud.map((e, i) => (
            <Sprite
              key={i}
              play={play}
              sequence="cloud"
              movingX={-e.speed * dificult}
              x={e.x}
              y={e.y}
              onDisappear={this.onCloudDisappear(i)}
            />
          ))}

          {cactus.map((e, i) => (
            <Sprite
              key={i}
              play={play}
              sequence={e.sequence}
              movingX={-groundSpeed * dificult}
              x={e.x}
              y={e.y}
              hitTest={{
                position: {
                  x: initialPlayerLeft,
                  y: position
                },
                rect: cuts[sequences.run[0]]
              }}
              onHit={this.gameOver}
              onDisappear={this.onCactusDisappear(i)}
            />
          ))}

          <Sprite
            play={play}
            sequence="flyingEnemy"
            movingX={-1.2 * ((dificult * groundSpeed) / 18) * FPS}
            x={pterodactyl.x}
            y={pterodactyl.y}
            fps={18}
            hitTest={{
              position: {
                x: initialPlayerLeft,
                y: position
              },
              rect: cuts[sequences.run[0]]
            }}
            onHit={this.gameOver}
            onDisappear={this.onPterodactylDisappear}
          />

          <Sprite
            play={play}
            sequence={activeSequence}
            y={position}
            x={initialPlayerLeft}
          />

          {gameOver ? (
            <Sprite
              sequence="gameOver"
              y={200}
              x={
                document.body.offsetWidth / 2 -
                cuts[sequences.gameOver[0]].width / 2
              }
            />
          ) : null}

          <Sprite
            play={play}
            sequence="ground"
            y={groundPosition}
            movingX={-groundSpeed * dificult}
          />
        </SpriteMapper>
      </div>
    );
  }
}

export default App;
