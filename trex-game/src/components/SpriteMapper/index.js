import * as React from "react";

import "./SpriteMapper/style.css";

const SpriteMapper = props => {
  const { sequences, cuts, src, fps, style } = props;

  return (
    <div className="SpriteMapper">
      {React.Children.map(props.children, child => {
        if (!child) return null;

        return React.cloneElement(child, {
          sequences,
          cuts,
          src,
          fps: child.props.fps || fps,
          style
        });
      })}
    </div>
  );
};

export default SpriteMapper;
