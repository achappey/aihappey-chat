import { Carousel as RBCarousel } from "react-bootstrap";
import type { JSX } from "react";
import type { AihUiTheme } from "aihappey-types";

export const Carousel: AihUiTheme["Carousel"] = ({
  id,
  activeIndex,
  onSelect,
  interval = 0,
  controls = true,
  indicators = true,
  slides,
  className,
  style,
}) => (
  <RBCarousel
    id={id}
    activeIndex={activeIndex}
    onSelect={onSelect}
    interval={interval > 0 ? interval : undefined}
    controls={controls}
    indicators={indicators}
    className={className}
    style={style}
    slide={true}
    fade={false}
    touch={true}
    pause={interval > 0 ? "hover" : undefined}
  >
    {slides.map((slide) => (
      <RBCarousel.Item key={slide.key}>
        {typeof slide.content === "string" ? (
          <img
            src={slide.content}
            alt={typeof slide.caption === "string" ? slide.caption : ""}
            className="d-block w-100"
          />
        ) : (
          slide.content
        )}
        {slide.caption && (
          <RBCarousel.Caption>
            {slide.caption}
          </RBCarousel.Caption>
        )}
      </RBCarousel.Item>
    ))}
  </RBCarousel>
);