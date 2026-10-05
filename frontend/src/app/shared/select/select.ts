import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../icon/icon';

export interface SelectOption {
  value: unknown;
  label: string;
  disabled?: boolean;
}

let nextId = 0;

//Custom dropdown that replaces the browser's native <select>.
@Component({
  selector: 'app-select',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './select.html',
  styleUrl: './select.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectComponent), multi: true }],
})
export class SelectComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
  options = input<SelectOption[]>([]);
  placeholder = input('');
  ariaLabel = input('');
  size = input<'md' | 'sm'>('md');
  disabled = input(false);

  readonly listId = `app-select-${nextId++}`;

  @ViewChild('trigger', { static: true }) private triggerRef!: ElementRef<HTMLButtonElement>;
  @ViewChild('panel', { static: true }) private panelRef!: ElementRef<HTMLElement>;
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  value = signal<unknown>(null);
  open = signal(false);
  active = signal(-1);
  placement = signal<'down' | 'up'>('down');
  pos = signal<{ left: number; width: number; top: number | null; bottom: number | null; maxHeight: number }>({
    left: 0,
    width: 0,
    top: 0,
    bottom: null,
    maxHeight: 280,
  });

  private formDisabled = signal(false);
  isDisabled = computed(() => this.disabled() || this.formDisabled());
  selectedIndex = computed(() => this.options().findIndex((o) => o.value === this.value()));
  selectedLabel = computed(() => {
    const i = this.selectedIndex();
    return i >= 0 ? this.options()[i].label : '';
  });

  private typeBuffer = '';
  private typeTimer: ReturnType<typeof setTimeout> | undefined;

  // --- ControlValueAccessor -------------------------------------------------
  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: unknown): void {
    this.value.set(value ?? null);
  }
  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
    if (isDisabled) this.close();
  }

  // --- Lifecycle ------------------------------------------------------------
  ngAfterViewInit() {
    document.body.appendChild(this.panelRef.nativeElement);
  }

  ngOnDestroy() {
    this.removeViewportListeners();
    clearTimeout(this.typeTimer);
    this.panelRef.nativeElement.remove();
  }

  // --- Open / close ---------------------------------------------------------
  toggle() {
    this.open() ? this.close() : this.openPanel();
  }

  private openPanel() {
    if (this.isDisabled() || this.options().length === 0) return;
    this.reposition();
    const sel = this.selectedIndex();
    this.active.set(sel >= 0 && !this.options()[sel].disabled ? sel : this.nextEnabled(-1, 1));
    this.open.set(true);
    window.addEventListener('scroll', this.onViewportChange, true);
    window.addEventListener('resize', this.onViewportChange);
    setTimeout(() => this.scrollToActive());
  }

  close() {
    if (!this.open()) return;
    this.open.set(false);
    this.active.set(-1);
    this.removeViewportListeners();
  }

  private onViewportChange = () => this.reposition();

  private removeViewportListeners() {
    window.removeEventListener('scroll', this.onViewportChange, true);
    window.removeEventListener('resize', this.onViewportChange);
  }

  private reposition() {
    const r = this.triggerRef.nativeElement.getBoundingClientRect();
    const gap = 6;
    const margin = 12;
    const below = window.innerHeight - r.bottom - margin;
    const above = r.top - margin;
    const wanted = Math.min(280, this.options().length * 40 + 12);
    const up = below < wanted && above > below;
    const maxHeight = Math.max(120, Math.min(280, (up ? above : below) - gap));

    this.placement.set(up ? 'up' : 'down');
    this.pos.set({
      left: r.left,
      width: r.width,
      top: up ? null : r.bottom + gap,
      bottom: up ? window.innerHeight - r.top + gap : null,
      maxHeight,
    });
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent) {
    if (!this.open()) return;
    const target = event.target as Node;
    if (this.host.nativeElement.contains(target) || this.panelRef.nativeElement.contains(target)) return;
    this.close();
  }

  onBlur() {
    this.close();
    this.onTouched();
  }

  // --- Selection ------------------------------------------------------------
  choose(index: number) {
    const option = this.options()[index];
    if (!option || option.disabled) return;
    this.value.set(option.value);
    this.onChange(option.value);
    this.onTouched();
    this.close();
  }

  onHover(index: number) {
    if (!this.options()[index]?.disabled) this.active.set(index);
  }

  // --- Keyboard -------------------------------------------------------------
  onKey(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (!this.open()) {
          this.openPanel();
        } else {
          this.active.set(this.nextEnabled(this.active(), event.key === 'ArrowDown' ? 1 : -1));
          this.scrollToActive();
        }
        break;
      }
      case 'Home':
      case 'End': {
        if (!this.open()) break;
        event.preventDefault();
        const last = event.key === 'End';
        this.active.set(this.nextEnabled(last ? this.options().length : -1, last ? -1 : 1));
        this.scrollToActive();
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        if (!this.open()) {
          this.openPanel();
        } else if (this.active() >= 0) {
          this.choose(this.active());
        } else {
          this.close();
        }
        break;
      }
      case 'Escape': {
        if (this.open()) {
          event.preventDefault();
          event.stopPropagation();
          this.close();
        }
        break;
      }
      default: {
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          this.typeahead(event.key.toLowerCase());
        }
      }
    }
  }

  private typeahead(char: string) {
    clearTimeout(this.typeTimer);
    this.typeBuffer += char;
    this.typeTimer = setTimeout(() => (this.typeBuffer = ''), 600);

    const options = this.options();
    const start = this.active() >= 0 ? this.active() : this.selectedIndex();
    for (let step = 1; step <= options.length; step++) {
      const i = (Math.max(start, -1) + step) % options.length;
      if (!options[i].disabled && options[i].label.toLowerCase().startsWith(this.typeBuffer)) {
        if (!this.open()) this.openPanel();
        this.active.set(i);
        this.scrollToActive();
        return;
      }
    }
  }

  private nextEnabled(from: number, dir: 1 | -1): number {
    const options = this.options();
    for (let i = from + dir; i >= 0 && i < options.length; i += dir) {
      if (!options[i].disabled) return i;
    }
    return from < 0 || from >= options.length ? -1 : from;
  }

  private scrollToActive() {
    this.panelRef.nativeElement
      .querySelector<HTMLElement>(`[data-i="${this.active()}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }
}