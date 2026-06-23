import { ChangeDetectionStrategy, Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { EmojiPickerComponent } from '@features/collaboration/components/emoji-picker/emoji-picker.component';
import { MentionDropdownComponent } from '@features/collaboration/components/mention-dropdown/mention-dropdown.component';
import { MAX_COMMENT_LENGTH } from '@features/collaboration/models/collaboration.enums';
import { draftStorageKey, renderMarkdownPreview } from '@features/collaboration/models/collaboration.utils';
import type { MentionUserOption } from '@features/collaboration/models/collaboration.models';

@Component({
  selector: 'app-comment-editor',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MentionDropdownComponent,
    EmojiPickerComponent,
  ],
  template: `
    <form class="comment-editor" [formGroup]="form" (ngSubmit)="onFormSubmit()" (keydown)="onKeydown($event)">
      <div class="comment-editor__toolbar" role="toolbar" aria-label="Formatting toolbar">
        <button type="button" mat-icon-button aria-label="Bold" (click)="wrap('**', '**')">
          <mat-icon>format_bold</mat-icon>
        </button>
        <button type="button" mat-icon-button aria-label="Italic" (click)="wrap('*', '*')">
          <mat-icon>format_italic</mat-icon>
        </button>
        <button type="button" mat-icon-button aria-label="Code" (click)="wrapCode()">
          <mat-icon>code</mat-icon>
        </button>
        <button type="button" mat-icon-button aria-label="Quote" (click)="prefix('> ')">
          <mat-icon>format_quote</mat-icon>
        </button>
        <button type="button" mat-icon-button aria-label="List" (click)="prefix('- ')">
          <mat-icon>format_list_bulleted</mat-icon>
        </button>
        <button type="button" mat-icon-button aria-label="Link" (click)="insertLink()">
          <mat-icon>link</mat-icon>
        </button>
        <button type="button" mat-icon-button aria-label="Emoji" (click)="emojiOpen.set(!emojiOpen())">
          <mat-icon>emoji_emotions</mat-icon>
        </button>
        <button type="button" mat-button (click)="previewMode.set(!previewMode())">
          {{ previewMode() ? 'Edit' : 'Preview' }}
        </button>
      </div>

      @if (emojiOpen()) {
        <app-emoji-picker [open]="true" (pick)="insertEmoji($event)" />
      }

      <div class="comment-editor__field-wrap">
        @if (previewMode()) {
          <div class="comment-editor__preview" [innerHTML]="previewHtml()"></div>
        } @else {
          <mat-form-field appearance="outline" class="comment-editor__field">
            <mat-label>{{ placeholder() }}</mat-label>
            <textarea
              #textarea
              matInput
              rows="4"
              formControlName="content"
              (input)="onInput()"
              [attr.maxlength]="maxLength"
            ></textarea>
            <mat-hint align="end">{{ charCount() }}/{{ maxLength }}</mat-hint>
          </mat-form-field>
        }

        <app-mention-dropdown
          [visible]="mentionOpen()"
          [options]="filteredMentions()"
          (select)="insertMention($event)"
        />
      </div>

      <div class="comment-editor__actions">
        @if (showCancel()) {
          <button mat-button type="button" (click)="cancel.emit()">Cancel</button>
        }
        <button mat-flat-button type="submit" [disabled]="form.invalid || saving()">
          {{ submitLabel() }}
        </button>
      </div>
    </form>
  `,
  styles: `
    .comment-editor {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .comment-editor__toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      align-items: center;
    }

    .comment-editor__field-wrap {
      position: relative;
    }

    .comment-editor__field {
      width: 100%;
    }

    .comment-editor__preview {
      min-height: 6rem;
      padding: 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container-lowest);
    }

    .comment-editor__actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentEditorComponent implements OnInit {
  readonly taskId = input.required<string>();
  readonly parentCommentId = input<string | null>(null);
  readonly placeholder = input('Write a comment...');
  readonly submitLabel = input('Post comment');
  readonly showCancel = input(false);
  readonly saving = input(false);
  readonly mentionUsers = input<MentionUserOption[]>([]);
  readonly initialContent = input('');
  readonly submitted = output<{ content: string; mentionedUserIds: string[] }>();
  readonly cancel = output<void>();

  private readonly fb = inject(FormBuilder);

  readonly maxLength = MAX_COMMENT_LENGTH;
  readonly previewMode = signal(false);
  readonly emojiOpen = signal(false);
  readonly mentionOpen = signal(false);
  readonly mentionQuery = signal('');
  readonly mentionedUserIds = signal<string[]>([]);

  readonly form = this.fb.nonNullable.group({
    content: ['', [Validators.required, Validators.maxLength(MAX_COMMENT_LENGTH)]],
  });

  ngOnInit(): void {
    this.restoreDraft(this.taskId());
    const initial = this.initialContent();
    if (initial) {
      this.form.patchValue({ content: initial });
    }
  }

  charCount() {
    return this.form.controls.content.value.length;
  }

  previewHtml() {
    return renderMarkdownPreview(this.form.controls.content.value);
  }

  filteredMentions() {
    const query = this.mentionQuery().toLowerCase();
    return this.mentionUsers().filter(
      (user) =>
        user.label.toLowerCase().includes(query) || user.email.toLowerCase().includes(query),
    );
  }

  onInput(): void {
    this.saveDraft();
    const value = this.form.controls.content.value;
    const match = value.match(/@([\w\s.]*)$/);
    if (match) {
      this.mentionOpen.set(true);
      this.mentionQuery.set(match[1] ?? '');
    } else {
      this.mentionOpen.set(false);
      this.mentionQuery.set('');
    }
  }

  insertMention(user: MentionUserOption): void {
    const value = this.form.controls.content.value.replace(/@[\w\s.]*$/, `@${user.label} `);
    this.form.patchValue({ content: value });
    this.mentionedUserIds.update((ids) => (ids.includes(user.id) ? ids : [...ids, user.id]));
    this.mentionOpen.set(false);
    this.saveDraft();
  }

  insertEmoji(emoji: string): void {
    this.form.patchValue({ content: `${this.form.controls.content.value}${emoji}` });
    this.emojiOpen.set(false);
    this.saveDraft();
  }

  wrapCode(): void {
    this.wrap('`', '`');
  }

  wrap(before: string, after: string): void {
    const control = this.form.controls.content;
    control.setValue(`${control.value}${before}text${after}`);
    this.saveDraft();
  }

  prefix(text: string): void {
    const control = this.form.controls.content;
    control.setValue(`${control.value}${text}`);
    this.saveDraft();
  }

  insertLink(): void {
    const control = this.form.controls.content;
    control.setValue(`${control.value}[label](https://)`);
    this.saveDraft();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancel.emit();
    }
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.submitForm();
    }
  }

  onFormSubmit(): void {
    this.submitForm();
  }

  private submitForm(): void {
    if (this.form.invalid) return;
    this.submitted.emit({
      content: this.form.controls.content.value.trim(),
      mentionedUserIds: this.mentionedUserIds(),
    });
    this.form.reset();
    this.mentionedUserIds.set([]);
    localStorage.removeItem(draftStorageKey(this.taskId(), this.parentCommentId()));
  }

  private restoreDraft(taskId: string): void {
    const raw = localStorage.getItem(draftStorageKey(taskId, this.parentCommentId()));
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as { content: string; mentionedUserIds: string[] };
      this.form.patchValue({ content: draft.content });
      this.mentionedUserIds.set(draft.mentionedUserIds ?? []);
    } catch {
      /* ignore */
    }
  }

  private saveDraft(): void {
    localStorage.setItem(
      draftStorageKey(this.taskId(), this.parentCommentId()),
      JSON.stringify({
        content: this.form.controls.content.value,
        mentionedUserIds: this.mentionedUserIds(),
        updatedAt: new Date().toISOString(),
      }),
    );
  }
}
