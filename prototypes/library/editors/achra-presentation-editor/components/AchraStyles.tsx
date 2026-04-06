export function AchraStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

      .achra-editor {
        --primary: #7A3AFF;
        --primary-foreground: #F3F5F7;
        --primary-30: rgba(122, 58, 255, 0.3);
        --secondary: #F4F4F4;
        --secondary-foreground: #343839;
        --accent: #F3F5F7;
        --accent-foreground: #000000;
        --background: #FCFCFC;
        --foreground: #343839;
        --foreground-70: rgba(52, 56, 57, 0.5);
        --foreground-50: rgba(52, 56, 57, 0.3);
        --card: #FCFCFC;
        --card-foreground: #343839;
        --card-foreground-50: rgba(52, 56, 57, 0.5);
        --muted: #EFEFEF;
        --muted-foreground: #9EA0A1;
        --destructive: #EA4335;
        --destructive-foreground: #FCFCFC;
        --destructive-30: rgba(234, 67, 53, 0.3);
        --border: #D7D8D9;
        --input: #FFFFFF;
        --ring: #343839;
        --progress: #329DFF;
        --progress-30: rgba(50, 157, 255, 0.3);
        --success: #4FC86F;
        --success-30: rgba(79, 200, 111, 0.3);
        --todo: #FFA132;
        --todo-30: rgba(255, 161, 50, 0.3);
        --yellow: #FAC400;
        --yellow-30: rgba(250, 196, 0, 0.3);
        --purple: #8E55EA;
        --purple-30: rgba(142, 85, 234, 0.3);

        font-family: 'Inter', sans-serif;
      }

      .achra-slide {
        width: 960px;
        height: 540px;
        position: relative;
        background: var(--background);
        color: var(--foreground);
        overflow: hidden;
        box-sizing: border-box;
      }

      .achra-slide * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      .achra-slide .slide-pad {
        display: flex;
        flex-direction: column;
        padding: 36px 40px;
        height: 100%;
        gap: 12px;
      }

      .achra-slide .slide-split {
        display: flex;
        height: 100%;
      }

      .achra-slide .slide-half {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 36px 32px;
        gap: 8px;
      }

      .achra-slide .slide-footer {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: var(--muted-foreground);
        font-weight: 500;
      }

      .achra-slide .primary-bg {
        background: var(--primary);
        color: #FCFCFC;
      }

      .achra-slide h1,
      .achra-slide h2,
      .achra-slide h3,
      .achra-slide h4,
      .achra-slide h5,
      .achra-slide h6,
      .achra-slide p {
        color: inherit;
      }

      .achra-slide .primary-bg h1,
      .achra-slide .primary-bg h2,
      .achra-slide .primary-bg h3,
      .achra-slide .primary-bg h4,
      .achra-slide .primary-bg h5,
      .achra-slide .primary-bg h6,
      .achra-slide .primary-bg p {
        color: inherit !important;
      }

      .achra-slide .accent-surface {
        background: var(--accent);
        border-radius: 10px;
        transition: background 0.3s;
      }

      .achra-slide .card-surface {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 10px;
      }

      .achra-slide .divider-bar {
        width: 40px;
        height: 4px;
        background: var(--primary);
        border-radius: 2px;
      }

      .achra-slide .icon-circle {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .achra-slide .bullet-list {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .achra-slide .bullet-list li {
        position: relative;
        padding-left: 16px;
        font-size: 12px;
        line-height: 1.6;
        color: var(--foreground-70);
      }

      .achra-slide .bullet-list li::before {
        content: '';
        position: absolute;
        left: 0;
        top: 7px;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--primary);
      }

      .achra-slide .img-placeholder {
        background: var(--muted);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--muted-foreground);
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 1px;
        flex: 1;
      }

      .achra-slide .num-list {
        list-style: none;
        counter-reset: steps;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .achra-slide .num-list li {
        counter-increment: steps;
        display: flex;
        align-items: flex-start;
        gap: 14px;
        font-size: 12px;
        line-height: 1.6;
        color: var(--foreground-70);
      }

      .achra-slide .num-list li::before {
        content: counter(steps);
        flex-shrink: 0;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--primary-30);
        color: var(--primary);
        font-weight: 700;
        font-size: 13px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .achra-slide .code-block {
        background: #1E222B;
        color: #E4E7EB;
        border-radius: 10px;
        padding: 20px;
        font-family: 'SF Mono', 'Fira Code', monospace;
        font-size: 11px;
        line-height: 1.7;
        white-space: pre;
        overflow: hidden;
      }

      .achra-slide .slide-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }

      .achra-slide .slide-table th {
        text-align: left;
        font-weight: 700;
        padding: 10px 14px;
        border-bottom: 2px solid var(--border);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--muted-foreground);
      }

      .achra-slide .slide-table td {
        padding: 10px 14px;
        border-bottom: 1px solid var(--border);
        font-weight: 500;
      }

      .achra-slide .avatar {
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 700;
        font-size: 12px;
      }

      .achra-slide .tag-pill {
        display: inline-flex;
        align-items: center;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
      }

      /* Editable text styling */
      .achra-slide [contenteditable] {
        outline: none;
        border-radius: 2px;
        transition: box-shadow 0.15s;
        cursor: text;
        min-width: 20px;
      }

      .achra-slide [contenteditable]:hover {
        box-shadow: 0 0 0 1px rgba(122, 58, 255, 0.3);
      }

      .achra-slide [contenteditable]:focus {
        box-shadow: 0 0 0 2px rgba(122, 58, 255, 0.5);
      }

      .achra-slide [contenteditable]:empty::before {
        content: attr(data-placeholder);
        color: var(--muted-foreground);
        pointer-events: none;
        font-style: italic;
        opacity: 0.6;
      }

      .achra-slide .primary-bg {
        --muted-foreground: rgba(252, 252, 252, 0.45);
        --foreground-70: rgba(252, 252, 252, 0.55);
        --border: rgba(252, 252, 252, 0.2);
      }

      .achra-slide .primary-bg [contenteditable]:empty::before {
        color: rgba(252, 252, 252, 0.4) !important;
      }

      .achra-slide .primary-bg [contenteditable]:hover {
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.3);
      }

      .achra-slide .primary-bg [contenteditable]:focus {
        box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.4);
      }

      /* List item controls */
      .achra-slide .list-item-wrapper {
        position: relative;
        display: flex;
        align-items: flex-start;
        gap: 4px;
      }

      .achra-slide .list-item-wrapper .item-delete {
        opacity: 0;
        transition: opacity 0.15s;
        cursor: pointer;
        color: var(--destructive);
        font-size: 14px;
        line-height: 1;
        flex-shrink: 0;
        border: none;
        background: none;
        padding: 2px;
      }

      .achra-slide .list-item-wrapper:hover .item-delete {
        opacity: 0.6;
      }

      .achra-slide .list-item-wrapper .item-delete:hover {
        opacity: 1;
      }

      .achra-slide .add-item-btn {
        border: 1px dashed var(--border);
        background: none;
        color: var(--muted-foreground);
        font-size: 11px;
        padding: 4px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-family: 'Inter', sans-serif;
        transition: border-color 0.15s, color 0.15s;
      }

      .achra-slide .add-item-btn:hover {
        border-color: var(--primary);
        color: var(--primary);
      }
    `}</style>
  );
}
