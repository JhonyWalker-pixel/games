import * as React from "react";

import "./components/Sprite/style.css";

export class Rect {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

export default class Sprite extends React.Component {
  state = {
    frame: 0,
    translateX: 0,
    translateY: 0,
    sequence: this.props.sequence
  };

  startTime = 0;

  static getDerivedStateFromProps(props, state) {
    if (props.sequence !== state.sequence) {
      return {
        frame: 0,
        sequence: props.sequence
      };
    }
    return null;
  }

  componentDidMount() {
    this.play();
  }

  play = () => {
    if (!this.startTime) this.startTime = Date.now();

    const { fps, play } = this.props;
    const elapsed = Date.now() - this.startTime;
    if (elapsed >= 1000 / fps) {
      if (play) this.loop();
      this.startTime = Date.now() - (elapsed % (1000 / fps));
    }

    requestAnimationFrame(this.play);
  };

  loop = () => {
    const { frame, translateX, translateY } = this.state;
    const { sequence, sequences, movingX, movingY } = this.props;

    this.setState({
      frame: (frame + 1) % sequences[sequence].length,
      translateX: movingX ? translateX + movingX : 0,
      translateY: movingY ? translateY + movingY : 0
    });
  };

  onDisappear = () => {
    const { onDisappear } = this.props;
    if (onDisappear) {
      setTimeout(() => {
        this.setState(
          {
            translateX: 0,
            translateY: 0
          },
          onDisappear
        );
      }, 0);
    }
  };

  onHit = () => {
    const { onHit } = this.props;
    if (onHit) onHit();
  };

  render() {
    const { frame, translateX, translateY } = this.state;
    const { sequences, cuts, style, src, sequence, y, x, hitTest } = this.props;

    const sequenceCuts = sequences[sequence].map(e => cuts[e]);
    const currentCut = sequenceCuts[frame];

    const thisLeft = x + translateX;
    const thisRight = x + currentCut.width + translateX;
    const thisTop = y + translateY;
    const thisBottom = y + currentCut.height + translateY;

    if (thisRight < 0) {
      this.onDisappear();
    }

    if (hitTest) {
      const tolerance = 10;

      const thatLeft = hitTest.position.x;
      const thatRight = hitTest.position.x + hitTest.rect.width;
      const thatTop = hitTest.position.y;
      const thatBottom = hitTest.position.y + hitTest.rect.height;

      const hitted =
        thatLeft + tolerance > thisRight - tolerance ||
        thatRight - tolerance < thisLeft + tolerance ||
        thatTop + tolerance > thisBottom - tolerance ||
        thatBottom - tolerance < thisTop + tolerance;

      if (!hitted) {
        this.onHit();
      }
    }

    return (
      <div
        className="Sprite"
        style={{
          ...style,
          left: `${x}px`,
          top: `${y}px`,
          ...(translateX || translateY
            ? {
                transform: `${
                  translateX
                    ? `translateX(${translateX}px)`
                    : `translateY(${translateY}px)`
                }`
              }
            : {}),
          backgroundImage: `url(${src})`,
          backgroundPosition: `-${currentCut.x}px -${currentCut.y}px`,
          height: `${currentCut.height}px`,
          width: `${currentCut.width}px`
        }}
      />
    );
  }
}
