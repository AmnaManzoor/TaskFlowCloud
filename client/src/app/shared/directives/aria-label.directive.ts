import { Directive, ElementRef, inject, input, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appAriaLabel]',
})
export class AriaLabelDirective implements OnInit {
  private readonly element = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  readonly appAriaLabel = input.required<string>();

  ngOnInit(): void {
    this.renderer.setAttribute(this.element.nativeElement, 'aria-label', this.appAriaLabel());
  }
}
