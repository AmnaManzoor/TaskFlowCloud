import { Directive, ElementRef, inject, input, OnInit } from '@angular/core';

@Directive({
  selector: '[appAutofocus]',
})
export class AutofocusDirective implements OnInit {
  private readonly element = inject(ElementRef<HTMLElement>);

  readonly appAutofocus = input(true);

  ngOnInit(): void {
    if (!this.appAutofocus()) {
      return;
    }

    queueMicrotask(() => this.element.nativeElement.focus());
  }
}
