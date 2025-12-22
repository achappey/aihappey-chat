import {
  Carousel as FluentCarousel,
  CarouselCard,
  CarouselSlider,
  CarouselViewport,
  CarouselNav,
  CarouselNavButton,
  CarouselNavContainer,
} from "@fluentui/react-components";
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
}) => {
  // Fluent's Carousel uses activeIndex/onActiveIndexChange
  // No built-in interval/auto-advance unless user triggers autoplay
  return (
    <FluentCarousel
      id={id}
      activeIndex={activeIndex}
      onActiveIndexChange={(_, data) => onSelect?.(data.index)}
      className={className}
      style={style}
      groupSize={1}
      circular={true}
      motion="slide"
    >
      <CarouselViewport>
        <CarouselSlider>
          {slides.map((slide, idx) => (
            <CarouselCard key={slide.key} aria-label={`${idx + 1} of ${slides.length}`}>
              {slide.content}
              {slide.caption && (
                <div style={{ marginTop: 8 }}>{slide.caption}</div>
              )}
            </CarouselCard>
          ))}
        </CarouselSlider>
      </CarouselViewport>
      {(controls || indicators) && (
        <CarouselNavContainer layout="inline">
          {indicators && (
            <CarouselNav>
              {(index) => (
                <CarouselNavButton aria-label={`Go to slide ${index + 1}`} />
              )}
            </CarouselNav>
          )}
        </CarouselNavContainer>
      )}
    </FluentCarousel>
  );
};