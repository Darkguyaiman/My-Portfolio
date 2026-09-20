(function () {
  const root = document.getElementById('darkAiRoot');
  if (!root) return;

  const panel = document.getElementById('darkAiPanel');
  const launcher = document.getElementById('darkAiLauncher');
  const closeBtn = document.getElementById('darkAiClose');
  const form = document.getElementById('darkAiForm');
  const input = document.getElementById('darkAiInput');
  const sendBtn = document.getElementById('darkAiSend');
  const messages = document.getElementById('darkAiMessages');
  const statusEl = document.getElementById('darkAiStatusText') || document.getElementById('darkAiStatus');
  const faceSlot = document.getElementById('darkAiFace');
  const faceHeaderSlot = document.getElementById('darkAiFaceHeader');
  const quickReplies = document.getElementById('darkAiQuickReplies');

  const history = [];
  let seed = '';
  let expression = 'idle';
  let open = false;
  let busy = false;
  let idleTimer = null;
  let decayTimer = null;
  let engagement = 0;
  let annoyance = 0;
  let gazeHandles = [];
  let faceRequestId = 0;
  let typingEl = null;
  let lastPointer = {
    x: typeof window !== 'undefined' ? window.innerWidth * 0.5 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight * 0.5 : 0,
  };

  const EXPRESSIONS = new Set([
    'idle', 'happy', 'sad', 'mad', 'surprised', 'wink', 'sleepy',
    'smug', 'unsure', 'scared', 'love', 'shy', 'sick', 'thinking',
  ]);

  const LOVEY_RE =
    /\b(love|loves|loved|adore|adores|adorable|cute|cutie|sweet|sweetheart|aw+h*|handsome|pretty|beautiful|crush|lovely|precious|so nice|i like (him|you|this)|you('re| are) (cute|sweet|lovely|amazing|adorable))\b|❤️|💕|💖|💗|😍|🥰|😘/;

  const BLUSH_RE =
    /\b(funny|funniest|cool|awesome|amazing|impressive|talented|smart|brilliant|epic|legendary|goat|dope|wonderful|fantastic|incredible|inspiring|clever|witty|charming|excellent|so cool|so funny|you('?re| are) (smart|the best)|he('?s| is) the best|damn you'?re?)\b/;

  /** Ranking / “who’s better” questions — praise words, not compliments. */
  const RANKING_RE =
    /\b(who('?s| is)|which|between)\b.{0,60}\b(best|better|worse|worst|goat)\b|\b(best|better)\b.{0,40}\b(me|you|him|or|darkguyaiman)\b/i;

  const JOKE_RE =
    /\b(joke|jokes|joking|pun|punny|dad\s*joke|dirty joke|sex joke|lmao+|rofl|knock[\s-]?knock|why did the|why don'?t(?:cha| you)?|what'?s?\s+another\s+name|what do you call|what is another name|another name (for|of)|another word for|what'?s another|what is .{0,40} (afraid of|called|for|of)|afraid of|what'?s the difference|how many .{0,40} does it take|walks into a(?:n)? bar|here'?s one|hear this|did you hear)\b/i;

  const JOKE_FOLLOWUP_RE =
    /^(nope|no+|nah|actually|wrong|nuh\s*uh|it'?s|the (answer|punchline) is|you (got|missed)|come on)\b/i;

  const WAITING_FOR_PUNCHLINE_RE =
    /\b(i'?m blanking|don'?t get it|no idea\.|i'?m lost|hit me with it|what'?s the punchline|tell me\.?$)\b/i;

  const WANTS_JOKE_TOLD_RE =
    /\b(tell( me)? (a |another |one more )?joke|got (any |a )?jokes?|make me laugh|say a joke|know any jokes?)\b/i;

  const WANTS_JOKE_EXPLAINED_RE =
    /\b(explain( the| this| that)? joke|why (is |was )?(that|it|this) funny|why did (it|that) get you|how do you understand|what does .{0,60} mean|why (did|does) (the )?joke|walk me through (the |that )?joke|in detail|more detail|more details|elaborate|go deeper|break it down|explain (it|that|this) more|say more)\b/i;

  const SEX_HUMOUR_RE =
    /\b(sex|sexy|sexual|boobs?|breasts?|penis|vagina|willy|dick|pussy|orgasm|cum+ing|coming in|dishwasher|blow ?job|naked|nude|bedroom|horny|intercourse|married|sucking|licking|ice cream parlor|jewelry)\b/i;

  const ANNOYANCE_STEPS = [
    { min: 0, expression: 'idle', status: "We're online" },
    { min: 1, expression: 'surprised', status: 'oh — hello?' },
    { min: 2, expression: 'unsure', status: 'you can just talk…' },
    { min: 3, expression: 'mad', status: 'okay, ease up' },
    { min: 4, expression: 'mad', status: 'stop poking' },
    { min: 5, expression: 'mad', status: 'getting annoyed' },
    { min: 6, expression: 'mad', status: 'last warning.' },
  ];

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function isLoveyText(text) {
    return LOVEY_RE.test(String(text || '').toLowerCase());
  }

  function isRankingQuestion(text) {
    return RANKING_RE.test(String(text || '').toLowerCase());
  }

  function isBlushText(text) {
    const lower = String(text || '').toLowerCase();
    if (isRankingQuestion(lower)) return false;
    return LOVEY_RE.test(lower) || BLUSH_RE.test(lower);
  }

  function isJokeText(text) {
    return JOKE_RE.test(String(text || '').toLowerCase());
  }

  function isSexHumour(text) {
    return SEX_HUMOUR_RE.test(String(text || ''));
  }

  function wantsJokeTold(text) {
    return WANTS_JOKE_TOLD_RE.test(String(text || '').toLowerCase());
  }

  function wantsJokeExplained(text) {
    const t = String(text || '').toLowerCase().trim();
    if (!t) return false;
    if (WANTS_JOKE_EXPLAINED_RE.test(t)) return true;
    if (/^(in detail|more|more detail|more details|elaborate|go deeper|continue|and\??)$/i.test(t)) {
      return history.some((turn) => (
        turn.role === 'user'
        && (
          looksLikeJokeSetup(turn.content)
          || isToldFullJoke(turn.content)
          || WANTS_JOKE_EXPLAINED_RE.test(String(turn.content || '').toLowerCase())
        )
      ));
    }
    return false;
  }

  function looksLikeJokeSetup(text) {
    const t = String(text || '').toLowerCase().trim();
    if (!t) return false;
    if (wantsJokeTold(t) || wantsJokeExplained(t)) return false;
    if (isJokeText(t)) return true;
    if (/^(what'?s?|what is|why|how|who|did you hear|so )\b/.test(t) && t.length <= 200) {
      if (/\b(get you|funny|understand|explain|mean)\b/.test(t)) return false;
      return /\b(call|name|word for|afraid|difference|happen|say|cumming|coming|inside|pilot|pasta|spy|woman|women|sex|boobs?|willy)\b/.test(t)
        || isSexHumour(t);
    }
    if (t.length <= 160 && isSexHumour(t) && /\?/.test(t)) return true;
    return false;
  }

  function isToldFullJoke(message) {
    const t = String(message || '').trim();
    if (t.length < 100) return false;
    if (wantsJokeTold(t) || wantsJokeExplained(t)) return false;
    if (!isSexHumour(t) && !/\b(joke|said|asks?|replied|teacher|wife|husband)\b/i.test(t)) return false;
    return /["“]|said|asks?|replied|then |finally |surprise/i.test(t);
  }

  function assistantWaitingForPunchline() {
    for (let i = history.length - 1; i >= 0; i -= 1) {
      const turn = history[i];
      if (!turn) continue;
      if (turn.role === 'assistant') return WAITING_FOR_PUNCHLINE_RE.test(turn.content);
      if (turn.role === 'user') return false;
    }
    return false;
  }

  function isJokePunchline(message) {
    if (wantsJokeTold(message) || wantsJokeExplained(message)) return false;
    if (isLoveyText(message) || isBlushText(message)) return false;
    if (isToldFullJoke(message)) return true;

    const trimmed = String(message || '').trim();
    if (!trimmed) return false;
    if (/\?/.test(trimmed)) return false;
    if (/^(why|how|what|explain|because|damn|wow|lol|haha|thanks|thank|in detail|more)\b/i.test(trimmed)) {
      return false;
    }

    if (!assistantWaitingForPunchline()) return false;
    if (looksLikeJokeSetup(trimmed) && !JOKE_FOLLOWUP_RE.test(trimmed)) return false;
    if (JOKE_FOLLOWUP_RE.test(trimmed)) return true;
    if (trimmed.split(/\s+/).length <= 14) return true;
    return false;
  }

  function resolveReplyMood(message, reply, apiExpression, apiLaugh) {
    if (apiLaugh || isJokePunchline(message) || wantsJokeTold(message)) {
      return { expression: 'happy', status: wantsJokeTold(message) ? 'telling one…' : 'hahaha', laugh: true };
    }
    if (wantsJokeExplained(message)) {
      return { expression: 'thinking', status: 'breaking it down…', laugh: false };
    }
    if (looksLikeJokeSetup(message)) {
      return { expression: 'unsure', status: 'wait… what?', laugh: false };
    }
    if (isLoveyText(message) || (apiExpression === 'love' && isBlushText(message))) {
      return { expression: 'love', status: 'blushing…', laugh: false };
    }
    if (isBlushText(message) || (apiExpression === 'shy' && isBlushText(message))) {
      return { expression: 'shy', status: 'blushing…', laugh: false };
    }
    const safeExpression = (apiExpression === 'love' || apiExpression === 'shy')
      ? 'happy'
      : apiExpression;
    return {
      expression: EXPRESSIONS.has(safeExpression) ? safeExpression : 'happy',
      status: "We're online",
      laugh: false,
    };
  }

  function stopGazes() {
    gazeHandles.forEach((handle) => {
      try { handle.stop(); } catch (_) {}
    });
    gazeHandles = [];
  }

  function aimGaze(handle, svg, clientX, clientY) {
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const len = Math.hypot(dx, dy);

    // Park the look target far in the pointer's direction so blobatar's
    // distance falloff never softens tracking when the cursor is far away.
    if (len < 0.5) {
      handle.lookAt({ x: clientX, y: clientY });
      return;
    }

    const far = Math.max(window.innerWidth, window.innerHeight, 1200);
    handle.lookAt({
      x: cx + (dx / len) * far,
      y: cy + (dy / len) * far,
    });
  }

  async function attachGazes() {
    stopGazes();
    if (prefersReducedMotion()) return;

    try {
      const mod = await import('/vendor/blobatar/gaze.js');
      const createGaze = mod.gaze;
      const svgs = root.querySelectorAll('.dark-ai-face-slot svg');

      svgs.forEach((svg) => {
        const handle = createGaze(svg, { target: null });
        const onMove = (event) => {
          lastPointer = { x: event.clientX, y: event.clientY };
          aimGaze(handle, svg, event.clientX, event.clientY);
        };

        window.addEventListener('pointermove', onMove, { passive: true });
        aimGaze(handle, svg, lastPointer.x, lastPointer.y);

        gazeHandles.push({
          stop() {
            window.removeEventListener('pointermove', onMove);
            handle.stop();
          },
        });
      });
    } catch (error) {
      console.warn('Ai-man gaze unavailable', error);
    }
  }

  function syncLauncherTooltip() {
    if (!launcher) return;
    const faceTip = document.getElementById('darkAiFaceTip');
    let tip = 'Chat with Ai-man';
    let headerTip = 'Ai-man';

    if (root.classList.contains('is-laugh')) {
      tip = "He's laughing";
      headerTip = "He's laughing";
      launcher.setAttribute('data-tooltip', tip);
      faceTip?.setAttribute('data-tooltip', headerTip);
      if (!open) launcher.setAttribute('aria-label', 'Ai-man is laughing — open chat');
      return;
    }
    if (expression === 'love' || expression === 'shy') {
      tip = "He's blushing";
      headerTip = "He's blushing";
      launcher.setAttribute('data-tooltip', tip);
      faceTip?.setAttribute('data-tooltip', headerTip);
      if (!open) launcher.setAttribute('aria-label', 'Ai-man is blushing — open chat');
      return;
    }
    if (expression === 'thinking' || busy) {
      tip = 'Thinking…';
      headerTip = 'Thinking…';
      launcher.setAttribute('data-tooltip', tip);
      faceTip?.setAttribute('data-tooltip', headerTip);
      if (!open) launcher.setAttribute('aria-label', 'Ai-man is thinking — open chat');
      return;
    }
    const mad = annoyance >= 3 || expression === 'mad';
    if (mad) {
      tip = "He's mad";
      headerTip = "He's mad";
      launcher.setAttribute('data-tooltip', tip);
      faceTip?.setAttribute('data-tooltip', headerTip);
      if (!open) launcher.setAttribute('aria-label', "Ai-man is mad — open chat");
    } else {
      launcher.setAttribute('data-tooltip', 'Chat with Ai-man');
      faceTip?.setAttribute('data-tooltip', 'Ai-man');
      if (!open) launcher.setAttribute('aria-label', 'Open Ai-man chat');
    }
  }

  let laughUntil = 0;

  function syncMoodClasses(nextExpression, options = {}) {
    if (options.laugh) {
      laughUntil = Date.now() + 5500;
    } else if (options.clearLaugh || nextExpression === 'thinking' || nextExpression === 'mad') {
      laughUntil = 0;
    }

    const laughing = Boolean(options.laugh) || Date.now() < laughUntil;
    root.classList.toggle('is-love', !laughing && (nextExpression === 'love' || nextExpression === 'shy'));
    root.classList.toggle('is-laugh', laughing);
    root.classList.toggle('is-thinking', nextExpression === 'thinking' || busy);
  }

  function kickLaughAnimation() {
    if (!root.classList.contains('is-laugh')) return;
    root.classList.remove('is-laugh');
    void root.offsetWidth;
    root.classList.add('is-laugh');
  }

  async function setExpression(next, statusText, options = {}) {
    const force = Boolean(options.force);
    const nextExpression = EXPRESSIONS.has(next) ? next : 'idle';
    if (!force && nextExpression === expression && faceSlot?.querySelector('svg') && !options.laugh) {
      if (statusText && statusEl) statusEl.textContent = statusText;
      syncMoodClasses(nextExpression, options);
      syncLauncherTooltip();
      return;
    }

    expression = nextExpression;
    if (statusText && statusEl) statusEl.textContent = statusText;
    syncMoodClasses(nextExpression, options);
    syncLauncherTooltip();

    const requestId = ++faceRequestId;
    const params = new URLSearchParams({
      expression,
      size: '96',
    });
    if (seed) params.set('seed', seed);
    // Bust any sticky face so laugh / mood swaps always re-render.
    if (options.laugh || force) params.set('_', String(Date.now()));

    try {
      const res = await fetch(`/api/chat/avatar?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('avatar failed');
      const data = await res.json();
      if (requestId !== faceRequestId) return;
      if (data.seed) seed = data.seed;

      if (faceSlot) faceSlot.innerHTML = data.svg || '';
      if (faceHeaderSlot) {
        faceHeaderSlot.innerHTML = (data.svg || '').replace(/width="96"/g, 'width="48"').replace(/height="96"/g, 'height="48"');
      }
      if (options.laugh) kickLaughAnimation();
      await attachGazes();
    } catch (_) {
      // Keep previous face if the request fails.
    }
  }

  function annoyanceStep() {
    let step = ANNOYANCE_STEPS[0];
    for (const candidate of ANNOYANCE_STEPS) {
      if (annoyance >= candidate.min) step = candidate;
    }
    return step;
  }

  function scheduleAnnoyanceDecay() {
    window.clearTimeout(decayTimer);
    decayTimer = window.setTimeout(() => {
      if (annoyance <= 0 || busy) return;
      annoyance = Math.max(0, annoyance - 1);
      root.classList.toggle('is-annoyed', annoyance >= 3);
      syncLauncherTooltip();
      if (!busy) {
        const step = annoyanceStep();
        setExpression(step.expression, annoyance === 0 ? "We're online" : step.status);
      }
      if (annoyance > 0) scheduleAnnoyanceDecay();
    }, 2800);
  }

  function pokeAnnoyance() {
    annoyance = Math.min(6, annoyance + 1);
    root.classList.toggle('is-annoyed', annoyance >= 3);
    launcher.classList.remove('is-annoyed');
    void launcher.offsetWidth;
    if (annoyance >= 3) launcher.classList.add('is-annoyed');
    syncLauncherTooltip();

    const step = annoyanceStep();
    setExpression(step.expression, step.status, { force: true });
    scheduleAnnoyanceDecay();
  }

  function setBusy(next) {
    busy = next;
    root.classList.toggle('is-busy', busy);
    root.classList.toggle('is-thinking', busy || expression === 'thinking');
    // Keep the textarea enabled so the visitor can keep typing without re-clicking.
    if (sendBtn) sendBtn.disabled = busy;
    syncLauncherTooltip();
  }

  function focusComposer() {
    if (!input || !open) return;
    window.requestAnimationFrame(() => {
      input.focus({ preventScroll: true });
    });
  }

  function hideQuickReplies() {
    if (quickReplies) quickReplies.hidden = true;
  }

  function scheduleIdleFace() {
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      if (busy || annoyance >= 2 || expression === 'love' || expression === 'shy') return;
      root.classList.remove('is-laugh');
      setExpression('sleepy', open ? 'still here…' : "We're online");
    }, 45000);
  }

  function bumpEngagement(amount) {
    engagement = Math.min(12, engagement + amount);
    if (busy || open || annoyance >= 2) return;
    if (engagement >= 8) setExpression('happy', 'watching you explore');
    else if (engagement >= 4) setExpression('smug', 'noticing the scroll');
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toSub(text) {
    const map = {
      0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉',
      a: 'ₐ', e: 'ₑ', h: 'ₕ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ', l: 'ₗ', m: 'ₘ', n: 'ₙ',
      o: 'ₒ', p: 'ₚ', r: 'ᵣ', s: 'ₛ', t: 'ₜ', u: 'ᵤ', v: 'ᵥ', x: 'ₓ',
      '+': '₊', '-': '₋',
    };
    return String(text).split('').map((ch) => map[ch] || map[ch.toLowerCase()] || ch).join('');
  }

  function toSup(text) {
    const map = {
      0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹',
      '+': '⁺', '-': '⁻',
    };
    return String(text).split('').map((ch) => map[ch] || ch).join('');
  }

  function simplifyLatex(raw) {
    let out = String(raw || '').trim();
    out = out.replace(/\\displaystyle\s*/g, '');
    out = out.replace(/\\text\{([^}]*)\}/g, '$1');
    out = out.replace(/\\mathrm\{([^}]*)\}/g, '$1');
    out = out.replace(/\\mathbf\{([^}]*)\}/g, '$1');
    out = out.replace(/\\Delta/g, 'Δ');
    out = out.replace(/\\delta/g, 'δ');
    out = out.replace(/\\circ/g, '°');
    out = out.replace(/\\rightarrow|\\to\b|\\longrightarrow/g, '→');
    out = out.replace(/\\leftarrow/g, '←');
    out = out.replace(/\\geq|\\ge\b/g, '≥');
    out = out.replace(/\\leq|\\le\b/g, '≤');
    out = out.replace(/\\neq|\\ne\b/g, '≠');
    out = out.replace(/\\approx/g, '≈');
    out = out.replace(/\\times/g, '×');
    out = out.replace(/\\cdot/g, '·');
    out = out.replace(/\\pm/g, '±');
    out = out.replace(/\\sum/g, 'Σ');
    out = out.replace(/\\infty/g, '∞');
    out = out.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)');
    out = out.replace(/_\{([^}]*)\}/g, (_, body) => {
      const mapped = toSub(body);
      return mapped === body ? `₍${body}₎` : mapped;
    });
    out = out.replace(/_([A-Za-z0-9])/g, (_, body) => {
      const mapped = toSub(body);
      return mapped === body ? body : mapped;
    });
    out = out.replace(/\^{([^}]*)}/g, (_, body) => toSup(body));
    out = out.replace(/\^([A-Za-z0-9+\-°])/g, (_, body) => toSup(body));
    out = out.replace(/\\,|\\;|\\!|\\ /g, ' ');
    out = out.replace(/[{}]/g, '');
    out = out.replace(/\s+/g, ' ').trim();
    return out;
  }

  function formatInline(text) {
    const slots = [];
    const stash = (html) => {
      slots.push(html);
      return `\u0000${slots.length - 1}\u0000`;
    };

    let source = String(text || '');
    source = source.replace(/\\\(([\s\S]*?)\\\)/g, (_, body) => (
      stash(`<span class="dark-ai-math">${escapeHtml(simplifyLatex(body))}</span>`)
    ));
    source = source.replace(/\$([^$\n]+?)\$/g, (_, body) => (
      stash(`<span class="dark-ai-math">${escapeHtml(simplifyLatex(body))}</span>`)
    ));

    let html = escapeHtml(source);
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(^|[^\w])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    html = html.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    );
    html = html.replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>',
    );
    html = html.replace(/\u0000(\d+)\u0000/g, (_, index) => slots[Number(index)] || '');
    return html;
  }

  function splitTableRow(line) {
    const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
    return trimmed.split('|').map((cell) => cell.trim());
  }

  function isTableSeparator(line) {
    return /^\s*\|?[\s:|-]+\|[\s|:|-]*$/.test(line);
  }

  function isTableRow(line) {
    return /^\s*\|.*\|\s*$/.test(line) || (/\|/.test(line) && isTableSeparator(line) === false && line.includes('|'));
  }

  function isHeading(line) {
    return /^#{1,6}\s+/.test(line.trim());
  }

  function isHr(line) {
    return /^\s*(-{3,}|_{3,}|\*{3,})\s*$/.test(line);
  }

  function isDisplayMathOpen(line) {
    return /^\s*\\\[\s*$/.test(line) || /^\s*\$\$\s*$/.test(line);
  }

  function isDisplayMathClose(line, opener) {
    if (opener === '$$') return /^\s*\$\$\s*$/.test(line);
    return /^\s*\\\]\s*$/.test(line);
  }

  function renderMarkdown(text) {
    let source = String(text || '').replace(/\r\n/g, '\n').trim();
    if (!source) return '<p></p>';

    source = source.replace(/\\\[([\s\S]*?)\\\]/g, (_, body) => (
      `\n@@DISPLAYMATH@@${simplifyLatex(body)}@@/DISPLAYMATH@@\n`
    ));
    source = source.replace(/\$\$([\s\S]*?)\$\$/g, (_, body) => (
      `\n@@DISPLAYMATH@@${simplifyLatex(body)}@@/DISPLAYMATH@@\n`
    ));

    const lines = source.split('\n');
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (!line.trim()) {
        i += 1;
        continue;
      }

      const displayToken = line.match(/^@@DISPLAYMATH@@([\s\S]*?)@@\/DISPLAYMATH@@$/);
      if (displayToken) {
        blocks.push(`<div class="dark-ai-math-block">${escapeHtml(displayToken[1].trim())}</div>`);
        i += 1;
        continue;
      }

      if (isDisplayMathOpen(line)) {
        const opener = line.trim().startsWith('$$') ? '$$' : '\\[';
        i += 1;
        const mathLines = [];
        while (i < lines.length && !isDisplayMathClose(lines[i], opener)) {
          mathLines.push(lines[i]);
          i += 1;
        }
        if (i < lines.length) i += 1;
        blocks.push(
          `<div class="dark-ai-math-block">${escapeHtml(simplifyLatex(mathLines.join(' ')))}</div>`,
        );
        continue;
      }

      if (isHr(line)) {
        blocks.push('<hr class="dark-ai-hr" />');
        i += 1;
        continue;
      }

      if (isHeading(line)) {
        const match = line.trim().match(/^(#{1,6})\s+(.*)$/);
        const level = Math.min(match[1].length, 4);
        blocks.push(`<h${level} class="dark-ai-h">${formatInline(match[2])}</h${level}>`);
        i += 1;
        continue;
      }

      const fenceOpen = line.match(/^```([\w+-]*)\s*$/);
      if (fenceOpen) {
        const lang = (fenceOpen[1] || '').toLowerCase();
        i += 1;
        const codeLines = [];
        while (i < lines.length && !/^```\s*$/.test(lines[i])) {
          codeLines.push(lines[i]);
          i += 1;
        }
        if (i < lines.length) i += 1;
        const label = lang
          ? `<span class="dark-ai-code-lang">${escapeHtml(lang)}</span>`
          : '<span class="dark-ai-code-lang">code</span>';
        blocks.push(
          `<div class="dark-ai-code-block"><div class="dark-ai-code-toolbar">${label}<button type="button" class="dark-ai-code-copy" aria-label="Copy code">Copy</button></div><pre class="dark-ai-pre"><code class="dark-ai-code${lang ? ` language-${escapeHtml(lang)}` : ''}">${escapeHtml(codeLines.join('\n'))}</code></pre></div>`,
        );
        continue;
      }

      const inlineFence = line.match(/^```([\w+-]+)\s+([\s\S]*?)```\s*$/);
      if (inlineFence) {
        const lang = inlineFence[1].toLowerCase();
        const code = inlineFence[2].trim();
        blocks.push(
          `<div class="dark-ai-code-block"><div class="dark-ai-code-toolbar"><span class="dark-ai-code-lang">${escapeHtml(lang)}</span><button type="button" class="dark-ai-code-copy" aria-label="Copy code">Copy</button></div><pre class="dark-ai-pre"><code class="dark-ai-code language-${escapeHtml(lang)}">${escapeHtml(code)}</code></pre></div>`,
        );
        i += 1;
        continue;
      }

      if (isTableRow(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
        const headers = splitTableRow(line);
        i += 2;
        const rows = [];
        while (i < lines.length && isTableRow(lines[i]) && !isTableSeparator(lines[i])) {
          rows.push(splitTableRow(lines[i]));
          i += 1;
        }

        const head = headers.map((cell) => `<th>${formatInline(cell)}</th>`).join('');
        const body = rows.map((row) => {
          const cells = headers.map((_, index) => `<td>${formatInline(row[index] || '')}</td>`).join('');
          return `<tr>${cells}</tr>`;
        }).join('');

        blocks.push(
          `<div class="dark-ai-table-wrap"><table class="dark-ai-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`,
        );
        continue;
      }

      if (/^\s*[-*•]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
        const items = [];
        const ordered = /^\s*\d+\.\s+/.test(line);
        while (i < lines.length && (/^\s*[-*•]\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i]))) {
          items.push(lines[i].replace(/^\s*([-*•]|\d+\.)\s+/, ''));
          i += 1;
        }
        const tag = ordered ? 'ol' : 'ul';
        blocks.push(`<${tag}>${items.map((item) => `<li>${formatInline(item)}</li>`).join('')}</${tag}>`);
        continue;
      }

      const paragraph = [];
      while (
        i < lines.length
        && lines[i].trim()
        && !/^```/.test(lines[i])
        && !isTableRow(lines[i])
        && !isHeading(lines[i])
        && !isHr(lines[i])
        && !isDisplayMathOpen(lines[i])
        && !/^@@DISPLAYMATH@@/.test(lines[i])
        && !/^\s*[-*•]\s+/.test(lines[i])
        && !/^\s*\d+\.\s+/.test(lines[i])
      ) {
        paragraph.push(lines[i].trim());
        i += 1;
      }
      blocks.push(`<p>${formatInline(paragraph.join('\n')).replace(/\n/g, '<br>')}</p>`);
    }

    return blocks.join('');
  }

  function scrollMessagesToBubble(bubble, kind) {
    if (!messages || !bubble) return;

    const align = () => {
      const viewH = messages.clientHeight;
      const bubbleH = bubble.offsetHeight;
      // Long bot replies: pin the start of the message into view so reading starts at the top.
      if (kind === 'bot' && bubbleH > viewH * 0.72) {
        const pad = Number.parseFloat(getComputedStyle(messages).paddingTop) || 0;
        messages.scrollTop = Math.max(0, bubble.offsetTop - pad);
        return;
      }
      messages.scrollTop = messages.scrollHeight;
    };

    requestAnimationFrame(() => {
      align();
      // Second pass after fonts / layout settle for tall markdown.
      requestAnimationFrame(align);
    });
  }

  function appendBubble(text, kind) {
    const bubble = document.createElement('div');
    bubble.className = `dark-ai-bubble dark-ai-bubble--${kind} dark-ai-bubble--enter`;

    if (kind === 'bot') {
      bubble.innerHTML = renderMarkdown(text);
    } else {
      const p = document.createElement('p');
      p.textContent = String(text || '');
      bubble.appendChild(p);
    }

    messages.appendChild(bubble);
    scrollMessagesToBubble(bubble, kind);
    return bubble;
  }

  async function copyCodeBlock(button) {
    const block = button.closest('.dark-ai-code-block');
    const codeEl = block?.querySelector('code');
    if (!codeEl) return;

    const text = codeEl.textContent || '';
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.left = '-9999px';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
      }
      button.textContent = 'Copied';
      button.classList.add('is-copied');
      window.setTimeout(() => {
        button.textContent = 'Copy';
        button.classList.remove('is-copied');
      }, 1400);
    } catch (_) {
      button.textContent = 'Failed';
      window.setTimeout(() => {
        button.textContent = 'Copy';
      }, 1400);
    }
  }

  messages?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest('.dark-ai-code-copy');
    if (!(button instanceof HTMLButtonElement)) return;
    event.preventDefault();
    copyCodeBlock(button);
  });

  function showTyping() {
    hideTyping();
    typingEl = document.createElement('div');
    typingEl.className = 'dark-ai-bubble dark-ai-bubble--bot dark-ai-bubble--typing dark-ai-bubble--enter';
    typingEl.innerHTML = '<span></span><span></span><span></span>';
    typingEl.setAttribute('aria-label', 'Ai-man is typing');
    messages.appendChild(typingEl);
    messages.scrollTop = messages.scrollHeight;
  }

  function hideTyping() {
    if (typingEl) {
      typingEl.remove();
      typingEl = null;
    }
  }

  function setOpen(next) {
    if (next === open) return;

    if (!next) {
      panel.classList.add('is-closing');
      window.setTimeout(() => {
        panel.hidden = true;
        panel.classList.remove('is-closing');
      }, prefersReducedMotion() ? 0 : 200);
    } else {
      panel.hidden = false;
      panel.classList.remove('is-closing');
    }

    open = next;
    launcher.classList.toggle('is-open', open);
    launcher.setAttribute('aria-expanded', open ? 'true' : 'false');
    launcher.setAttribute('aria-label', open ? 'Ai-man chat open' : 'Open Ai-man chat');

    if (open) {
      if (annoyance < 2) setExpression('surprised', 'listening');
      focusComposer();
    } else if (annoyance < 2) {
      setExpression(engagement >= 4 ? 'wink' : 'idle', "We're online");
    }
    scheduleIdleFace();
  }

  async function loadMood() {
    try {
      const res = await fetch('/api/chat/mood', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('mood failed');
      const data = await res.json();
      seed = data.seed || '';
      root.dataset.seed = seed;
    } catch (_) {
      seed = `dark-ai-${new Date().toISOString().slice(0, 10)}`;
    }
    await setExpression('idle', "We're online", { force: true });
  }

  async function sendMessage(raw) {
    const message = String(raw || '').trim();
    if (!message || busy) return;

    hideQuickReplies();
    appendBubble(message, 'user');
    history.push({ role: 'user', content: message });
    if (history.length > 12) history.splice(0, history.length - 12);

    input.value = '';
    resizeInput();
    setBusy(true);
    focusComposer();
    showTyping();
    setExpression('thinking', 'thinking…', { force: true, clearLaugh: true });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          message,
          history: history.slice(0, -1),
          pagePath: window.location.pathname + window.location.hash,
        }),
      });

      const data = await res.json().catch(() => ({}));
      hideTyping();

      if (!res.ok) {
        const sleepy = data.expression === 'sleepy' || res.status === 429;
        const sleepyMsg = data.error || "Ai-man is sleepy — I'm going to sleep now.";
        appendBubble(sleepy ? sleepyMsg : (data.error || 'Ai-man could not reply.'), sleepy ? 'bot' : 'error');
        setExpression(
          data.expression || (sleepy ? 'sleepy' : 'sad'),
          sleepy ? 'zzz…' : 'signal dropped',
          { force: true },
        );
        return;
      }

      const reply = data.reply || '…';
      appendBubble(reply, 'bot');
      history.push({ role: 'assistant', content: reply });
      if (data.seed) seed = data.seed;
      annoyance = Math.max(0, annoyance - 1);
      root.classList.toggle('is-annoyed', annoyance >= 3);

      const mood = resolveReplyMood(message, reply, data.expression, Boolean(data.laugh));
      setExpression(mood.expression, mood.status, { force: true, laugh: mood.laugh });
    } catch (_) {
      hideTyping();
      appendBubble('Network hiccup. Ai-man will try again when you resend.', 'error');
      setExpression('scared', 'offline blip', { force: true });
    } finally {
      setBusy(false);
      focusComposer();
      scheduleIdleFace();
    }
  }

  launcher.addEventListener('click', () => {
    if (!open) {
      setOpen(true);
      pokeAnnoyance();
      return;
    }
    pokeAnnoyance();
  });

  closeBtn?.addEventListener('click', () => setOpen(false));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && open) setOpen(false);
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    sendMessage(input.value);
  });

  quickReplies?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const chip = target.closest('[data-prompt]');
    if (!(chip instanceof HTMLElement)) return;
    const prompt = chip.getAttribute('data-prompt');
    if (!prompt || busy) return;
    hideQuickReplies();
    sendMessage(prompt);
  });

  input?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form?.requestSubmit();
    }
  });

  function resizeInput() {
    if (!input) return;
    input.style.height = 'auto';
    const next = Math.min(Math.max(input.scrollHeight, 44), 160);
    input.style.height = `${next}px`;
  }

  input?.addEventListener('input', () => {
    resizeInput();
    scheduleIdleFace();
    if (!busy && open && annoyance < 2 && expression !== 'love' && expression !== 'shy' && Date.now() >= laughUntil) {
      setExpression('surprised', 'listening');
    }
  });

  // Keep the first paint sized correctly after fonts load.
  resizeInput();

  let scrollTicks = 0;
  window.addEventListener('scroll', () => {
    scrollTicks += 1;
    if (scrollTicks % 8 === 0) bumpEngagement(1);
  }, { passive: true });

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('#projects, .project-card, .skills, .experience, .education, .contact')) {
      bumpEngagement(2);
    }
  });

  loadMood();
  scheduleIdleFace();

  window.addEventListener('pointermove', (event) => {
    lastPointer = { x: event.clientX, y: event.clientY };
  }, { passive: true });
})();
