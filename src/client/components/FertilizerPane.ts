/**
 * Terminal-style Fertilizer Guidance Pane
 * Sandboxed, minimal, text-based UI for displaying fertilizer recommendations
 */

interface FertilizerAction {
  step: string;
  amount_per_ha: string;
  amount_per_quintal: string;
  timing: string;
}

interface Supplier {
  name: string;
  url: string;
}

interface Citation {
  title: string;
  url: string;
  snippet: string;
}

interface FertilizerData {
  title: string;
  summary: string;
  actions: FertilizerAction[];
  pest_interactions: string;
  suppliers: Supplier[];
  confidence_score: number;
  citations: Citation[];
  raw_search_hits: any[];
}

export class FertilizerPane {
  private container: HTMLElement;
  private isVisible: boolean = false;
  private currentData: FertilizerData | null = null;

  constructor() {
    this.container = this.createContainer();
    this.setupKeyboardShortcuts();
  }

  /**
   * Create the main container with terminal styling
   */
  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'fertilizer-pane';
    container.className = 'fertilizer-pane hidden';
    container.innerHTML = `
      <style>
        .fertilizer-pane {
          position: fixed;
          top: 10px;
          right: 10px;
          width: 480px;
          max-height: 70vh;
          background: #1a1a1a;
          border: 2px solid #4a9eff;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          color: #00ff41;
          z-index: 9999;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(74, 158, 255, 0.3);
        }
        .fertilizer-pane.hidden {
          display: none;
        }
        .fertilizer-header {
          background: #2d2d2d;
          padding: 8px 12px;
          border-bottom: 1px solid #4a9eff;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .fertilizer-title {
          color: #4a9eff;
          font-weight: bold;
          font-size: 13px;
        }
        .fertilizer-controls {
          display: flex;
          gap: 8px;
        }
        .fertilizer-btn {
          background: #333;
          border: 1px solid #4a9eff;
          color: #4a9eff;
          padding: 2px 8px;
          font-size: 10px;
          cursor: pointer;
          border-radius: 3px;
          font-family: inherit;
        }
        .fertilizer-btn:hover {
          background: #4a9eff;
          color: #1a1a1a;
        }
        .fertilizer-content {
          padding: 12px;
          max-height: calc(70vh - 60px);
          overflow-y: auto;
          line-height: 1.4;
        }
        .fertilizer-section {
          margin-bottom: 16px;
        }
        .fertilizer-section-title {
          color: #ffff00;
          font-weight: bold;
          margin-bottom: 4px;
        }
        .fertilizer-summary {
          color: #00ff41;
          margin-bottom: 12px;
          font-size: 11px;
        }
        .fertilizer-action {
          background: #2a2a2a;
          border-left: 3px solid #4a9eff;
          padding: 6px 8px;
          margin-bottom: 6px;
          font-size: 11px;
        }
        .fertilizer-action-step {
          color: #4a9eff;
          font-weight: bold;
        }
        .fertilizer-action-detail {
          color: #cccccc;
          margin-top: 2px;
        }
        .fertilizer-supplier {
          color: #00ff41;
          text-decoration: underline;
          cursor: pointer;
          font-size: 10px;
        }
        .fertilizer-confidence {
          background: #2a2a2a;
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 10px;
          display: inline-block;
        }
        .fertilizer-citation {
          background: #2a2a2a;
          border-left: 2px solid #ffff00;
          padding: 4px 6px;
          margin-bottom: 4px;
          font-size: 10px;
        }
        .fertilizer-citation-title {
          color: #ffff00;
          cursor: pointer;
          text-decoration: underline;
        }
        .fertilizer-citation-snippet {
          color: #cccccc;
          margin-top: 2px;
        }
        .fertilizer-loading {
          text-align: center;
          color: #4a9eff;
          padding: 40px;
        }
        .fertilizer-error {
          color: #ff4444;
          text-align: center;
          padding: 20px;
        }
        .fertilizer-copy-btn {
          background: #2d5a2d;
          border: 1px solid #4a9eff;
          color: #00ff41;
          padding: 4px 12px;
          font-size: 10px;
          cursor: pointer;
          border-radius: 3px;
          font-family: inherit;
          margin-top: 8px;
        }
        .fertilizer-copy-btn:hover {
          background: #4a9eff;
          color: #1a1a1a;
        }
      </style>
      <div class="fertilizer-header">
        <div class="fertilizer-title">🌾 FERTILIZER GUIDANCE</div>
        <div class="fertilizer-controls">
          <button class="fertilizer-btn" onclick="fertilizerPane.copyChecklist()">Copy Checklist</button>
          <button class="fertilizer-btn" onclick="fertilizerPane.showSources()">Show Sources</button>
          <button class="fertilizer-btn" onclick="fertilizerPane.hide()">✕</button>
        </div>
      </div>
      <div class="fertilizer-content" id="fertilizer-content">
        <div class="fertilizer-loading">Loading fertilizer recommendations...</div>
      </div>
    `;

    document.body.appendChild(container);
    return container;
  }

  /**
   * Setup keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // Ctrl+F for manual fertilizer pane toggle
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        this.toggle();
      }
      // Escape to close
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }

  /**
   * Show the fertilizer pane with loading state
   */
  show(): void {
    this.container.classList.remove('hidden');
    this.isVisible = true;
    console.log('🌾 Fertilizer pane opened');
  }

  /**
   * Hide the fertilizer pane
   */
  hide(): void {
    this.container.classList.add('hidden');
    this.isVisible = false;
    console.log('🌾 Fertilizer pane closed');
  }

  /**
   * Toggle visibility
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Fetch and display fertilizer recommendations
   */
  async fetchAndDisplay(location: string, crop: string, soil: string, expectedYield?: string): Promise<void> {
    this.show();
    
    const content = document.getElementById('fertilizer-content');
    if (!content) return;

    content.innerHTML = '<div class="fertilizer-loading">🔍 Fetching fertilizer recommendations...</div>';

    try {
      const params = new URLSearchParams({
        location,
        crop,
        soil
      });

      if (expectedYield) {
        params.append('expectedYield', expectedYield);
      }

      console.log(`🌾 Fetching fertilizer data for ${crop} in ${location}`);

      const response = await fetch(`/api/agent/browser-fertilizer?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch fertilizer recommendations');
      }

      this.currentData = result.data;
      this.renderContent(result.data);

    } catch (error) {
      console.error('Fertilizer fetch error:', error);
      content.innerHTML = `
        <div class="fertilizer-error">
          ❌ Failed to load fertilizer recommendations<br>
          ${error instanceof Error ? error.message : 'Unknown error'}<br>
          <button class="fertilizer-btn" onclick="fertilizerPane.retry()" style="margin-top: 8px;">Retry</button>
        </div>
      `;
    }
  }

  /**
   * Render fertilizer content
   */
  private renderContent(data: FertilizerData): void {
    const content = document.getElementById('fertilizer-content');
    if (!content) return;

    const confidenceColor = data.confidence_score >= 0.8 ? '#00ff41' : 
                           data.confidence_score >= 0.6 ? '#ffff00' : '#ff8c00';

    content.innerHTML = `
      <div class="fertilizer-section">
        <div class="fertilizer-section-title">📋 SUMMARY</div>
        <div class="fertilizer-summary">${data.summary}</div>
        <div class="fertilizer-confidence" style="color: ${confidenceColor}">
          Confidence: ${Math.round(data.confidence_score * 100)}%
        </div>
      </div>

      <div class="fertilizer-section">
        <div class="fertilizer-section-title">⚡ ACTION STEPS</div>
        ${data.actions.map(action => `
          <div class="fertilizer-action">
            <div class="fertilizer-action-step">${action.step}</div>
            <div class="fertilizer-action-detail">
              📏 Per Hectare: ${action.amount_per_ha}<br>
              📦 Per Quintal: ${action.amount_per_quintal}<br>
              ⏰ Timing: ${action.timing}
            </div>
          </div>
        `).join('')}
      </div>

      <div class="fertilizer-section">
        <div class="fertilizer-section-title">🐛 PEST INTERACTIONS</div>
        <div class="fertilizer-summary">${data.pest_interactions}</div>
      </div>

      <div class="fertilizer-section">
        <div class="fertilizer-section-title">🏪 SUPPLIERS</div>
        ${data.suppliers.map(supplier => `
          <div>
            <a href="${supplier.url}" target="_blank" class="fertilizer-supplier">
              ${supplier.name}
            </a>
          </div>
        `).join('')}
      </div>

      <div class="fertilizer-section">
        <div class="fertilizer-section-title">📚 SOURCES</div>
        ${data.citations.map(citation => `
          <div class="fertilizer-citation">
            <div class="fertilizer-citation-title" onclick="window.open('${citation.url}', '_blank')">
              ${citation.title}
            </div>
            <div class="fertilizer-citation-snippet">${citation.snippet}</div>
          </div>
        `).join('')}
      </div>

      <button class="fertilizer-copy-btn" onclick="fertilizerPane.copyChecklist()">
        📋 Copy as Checklist
      </button>
    `;
  }

  /**
   * Copy actionable steps as checklist
   */
  copyChecklist(): void {
    if (!this.currentData) return;

    const checklist = [
      `🌾 FERTILIZER CHECKLIST FOR ${this.currentData.title.toUpperCase()}`,
      '',
      '📋 ACTION STEPS:',
      ...this.currentData.actions.map((action, index) => 
        `${index + 1}. ${action.step}\n   - Per Hectare: ${action.amount_per_ha}\n   - Per Quintal: ${action.amount_per_quintal}\n   - Timing: ${action.timing}`
      ),
      '',
      '🐛 PEST CONSIDERATIONS:',
      `- ${this.currentData.pest_interactions}`,
      '',
      '🏪 SUPPLIERS:',
      ...this.currentData.suppliers.map(supplier => `- ${supplier.name}: ${supplier.url}`),
      '',
      `📊 Confidence: ${Math.round(this.currentData.confidence_score * 100)}%`,
      `📅 Generated: ${new Date().toLocaleString()}`
    ].join('\n');

    navigator.clipboard.writeText(checklist).then(() => {
      console.log('✅ Fertilizer checklist copied to clipboard');
      // Show temporary success message
      const btn = document.querySelector('.fertilizer-copy-btn') as HTMLButtonElement;
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = '✅ Copied!';
        btn.style.background = '#2d5a2d';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '';
        }, 2000);
      }
    }).catch(err => {
      console.error('Failed to copy checklist:', err);
      alert('Failed to copy checklist. Please try again.');
    });
  }

  /**
   * Show sources in expanded view
   */
  showSources(): void {
    if (!this.currentData) return;

    const sourcesWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    if (!sourcesWindow) {
      alert('Please allow popups to view sources');
      return;
    }

    sourcesWindow.document.write(`
      <html>
        <head>
          <title>Fertilizer Sources - ${this.currentData.title}</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              background: #1a1a1a; 
              color: #00ff41; 
              padding: 20px; 
            }
            h1 { color: #4a9eff; }
            .source { 
              background: #2a2a2a; 
              border-left: 3px solid #4a9eff; 
              padding: 15px; 
              margin: 15px 0; 
            }
            .source-title { 
              color: #ffff00; 
              font-weight: bold; 
              margin-bottom: 8px; 
            }
            .source-url { 
              color: #4a9eff; 
              word-break: break-all; 
            }
            .source-snippet { 
              color: #cccccc; 
              margin-top: 8px; 
              line-height: 1.4; 
            }
          </style>
        </head>
        <body>
          <h1>📚 Fertilizer Recommendation Sources</h1>
          <p><strong>Crop:</strong> ${this.currentData.title}</p>
          <p><strong>Confidence Score:</strong> ${Math.round(this.currentData.confidence_score * 100)}%</p>
          
          ${this.currentData.citations.map(citation => `
            <div class="source">
              <div class="source-title">${citation.title}</div>
              <div class="source-url"><a href="${citation.url}" target="_blank">${citation.url}</a></div>
              <div class="source-snippet">${citation.snippet}</div>
            </div>
          `).join('')}
          
          <p><em>Generated: ${new Date().toLocaleString()}</em></p>
        </body>
      </html>
    `);
    sourcesWindow.document.close();
  }

  /**
   * Retry fetching data
   */
  retry(): void {
    // This would need the original parameters stored
    console.log('🔄 Retrying fertilizer fetch...');
  }
}

// Global instance
declare global {
  interface Window {
    fertilizerPane: FertilizerPane;
  }
}

// Initialize global instance
window.fertilizerPane = new FertilizerPane();

export default FertilizerPane;
