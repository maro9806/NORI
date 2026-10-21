document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. 유틸리티 함수 (토스트 알림, 커스텀 모달, JSON 다운로드 등)
  // ==========================================
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');
  }

  // --- Cyber Toast UI Notification (Zero browser alert) ---
  let toastContainer = document.getElementById('cyberToastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'cyberToastContainer';
    toastContainer.className = 'cyber-toast-container';
    document.body.appendChild(toastContainer);
  }

  function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `cyber-toast ${type}`;
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg class="icon-svg-sm" viewBox="0 0 24 24" style="fill:#10b981;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg class="icon-svg-sm" viewBox="0 0 24 24" style="fill:#f7768e;"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
    } else if (type === 'warn') {
      iconSvg = '<svg class="icon-svg-sm" viewBox="0 0 24 24" style="fill:#e0af68;"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>';
    } else {
      iconSvg = '<svg class="icon-svg-sm" viewBox="0 0 24 24" style="fill:#7aa2f7;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>';
    }
    toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // --- In-App Custom Modal Dialogs (Zero window.confirm / window.prompt) ---
  function showModalConfirm(title, message, onConfirm) {
    const backdrop = document.createElement('div');
    backdrop.className = 'custom-modal-backdrop';
    backdrop.innerHTML = `
      <div class="custom-modal-box">
        <div class="custom-modal-title">
          <svg class="icon-svg-sm" viewBox="0 0 24 24" style="fill:#e0af68;"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
          <span>${escapeHtml(title)}</span>
        </div>
        <div class="custom-modal-body">${escapeHtml(message)}</div>
        <div class="custom-modal-actions">
          <button class="btn-solid-secondary btn-modal-cancel">취소</button>
          <button class="btn-solid-primary danger btn-modal-confirm">확인</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);
    requestAnimationFrame(() => backdrop.classList.add('open'));

    const close = () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    };

    backdrop.querySelector('.btn-modal-cancel').addEventListener('click', close);
    backdrop.querySelector('.btn-modal-confirm').addEventListener('click', () => {
      close();
      if (typeof onConfirm === 'function') onConfirm();
    });
  }

  function showModalPrompt(title, placeholder, defaultValue, onConfirm) {
    const backdrop = document.createElement('div');
    backdrop.className = 'custom-modal-backdrop';
    backdrop.innerHTML = `
      <div class="custom-modal-box">
        <div class="custom-modal-title">
          <svg class="icon-svg-sm" viewBox="0 0 24 24" style="fill:#7aa2f7;"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          <span>${escapeHtml(title)}</span>
        </div>
        <input type="text" class="dark-input custom-modal-input" placeholder="${escapeHtml(placeholder || '')}" value="${escapeHtml(defaultValue || '')}">
        <div class="custom-modal-actions">
          <button class="btn-solid-secondary btn-modal-cancel">취소</button>
          <button class="btn-solid-primary btn-modal-confirm">확인</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);
    requestAnimationFrame(() => {
      backdrop.classList.add('open');
      const input = backdrop.querySelector('.custom-modal-input');
      if (input) {
        input.focus();
        input.select();
      }
    });

    const close = () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    };

    const submit = () => {
      const val = backdrop.querySelector('.custom-modal-input').value.trim();
      close();
      if (typeof onConfirm === 'function') onConfirm(val);
    };

    backdrop.querySelector('.btn-modal-cancel').addEventListener('click', close);
    backdrop.querySelector('.btn-modal-confirm').addEventListener('click', submit);
    backdrop.querySelector('.custom-modal-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
      if (e.key === 'Escape') close();
    });
  }

  function downloadJson(filename, data) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function readJsonFile(callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    input.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          callback(parsed, file.name);
        } catch (err) {
          showToast('JSON 파일을 파싱하는 데 실패했습니다: ' + err.message, 'error');
        }
      };
      reader.readAsText(file, 'utf-8');
      document.body.removeChild(input);
    });
    document.body.appendChild(input);
    input.click();
  }

  // ==========================================
  // 2. 사이드바 전환 탭 ([채팅] <-> [설정]) & 5대 기능 아이콘 바
  // ==========================================
  const tabChatBtn = document.getElementById('tabChatBtn');
  const tabSettingsBtn = document.getElementById('tabSettingsBtn');
  const chatView = document.getElementById('chatView');
  const settingsView = document.getElementById('settingsView');

  tabChatBtn.addEventListener('click', () => {
    tabChatBtn.classList.add('active');
    tabSettingsBtn.classList.remove('active');
    chatView.style.display = 'flex';
    settingsView.style.display = 'none';
  });

  tabSettingsBtn.addEventListener('click', () => {
    tabSettingsBtn.classList.add('active');
    tabChatBtn.classList.remove('active');
    chatView.style.display = 'none';
    settingsView.style.display = 'flex';
    renderLorebookView();
  });

  // 사이드바 접기 / 펼치기
  const sidebar = document.getElementById('sidebar');
  const btnToggleSidebar = document.getElementById('btnToggleSidebar');

  btnToggleSidebar.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    btnToggleSidebar.textContent = sidebar.classList.contains('collapsed') ? '→' : '←';
  });

  // 6대 기능 아이콘 바 전환 ([로어북], [모듈], [TTS], [스크립트], [고급설정], [삭제])
  const navIconBtns = document.querySelectorAll('.nav-icon-btn');
  const subPanels = {
    lorebook: document.getElementById('lorebookPanel'),
    modules: document.getElementById('modulesPanel'),
    tts: document.getElementById('ttsPanel'),
    script: document.getElementById('scriptPanel'),
    advanced: document.getElementById('advancedPanel'),
    delete: document.getElementById('deletePanel')
  };

  navIconBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      navIconBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      Object.keys(subPanels).forEach(key => {
        if (subPanels[key]) {
          subPanels[key].style.display = (key === target) ? 'flex' : 'none';
        }
      });

      if (target === 'lorebook') renderLorebookView();
      if (target === 'modules') renderModulesEditor();
      if (target === 'script') renderScriptView();
      if (target === 'tts') loadTtsVoices();
    });
  });

  // ==========================================
  // 3. 캐릭터 감정 모드 (Emotion System for @@emo)
  // ==========================================
  const avatarEmoji = document.getElementById('avatarEmoji');
  const statusIndicator = document.getElementById('statusIndicator');
  const emotionBadgeBox = document.getElementById('emotionBadgeBox');
  const emotionBadge = document.getElementById('emotionBadge');

  let currentEmotion = '기본';
  let emotionLocked = false;

  const emotionEmojiMap = {
    '기쁨': '[기쁨]', 'happy': '[기쁨]', 'smile': '[미소]', '미소': '[미소]',
    '슬픔': '[슬픔]', 'sad': '[슬픔]', '우울': '[우울]',
    '화남': '[경계]', 'angry': '[경계]', '분노': '[경계]',
    '생각중': '[추론]', 'thinking': '[추론]',
    '놀람': '[감지]', 'surprise': '[감지]',
    '사랑': '[신뢰]', 'love': '[신뢰]',
    '기본': '[대기]', 'default': '[대기]'
  };

  function setEmotion(emotionName, lock = true) {
    if (!emotionName) return;
    currentEmotion = emotionName.trim();
    if (lock) emotionLocked = true;

    const badgeLabel = emotionEmojiMap[currentEmotion.toLowerCase()] || emotionEmojiMap[currentEmotion] || `[${currentEmotion}]`;
    if (statusIndicator) statusIndicator.textContent = `온라인 · ${badgeLabel}`;
    if (emotionBadge) emotionBadge.textContent = `감정 상태: ${currentEmotion}`;
    if (emotionBadgeBox) emotionBadgeBox.style.display = 'inline-flex';

    // 사이버 코어 발광 컬러 반응
    const cyberCore = document.getElementById('cyberCore');
    if (cyberCore) {
      if (['화남', 'angry', '분노'].includes(currentEmotion.toLowerCase())) {
        cyberCore.style.filter = 'drop-shadow(0 0 16px rgba(247, 118, 142, 0.8))';
      } else if (['생각중', 'thinking'].includes(currentEmotion.toLowerCase())) {
        cyberCore.style.filter = 'drop-shadow(0 0 16px rgba(122, 162, 247, 0.8))';
      } else {
        cyberCore.style.filter = '';
      }
    }
  }

  // ==========================================
  // 4. 채팅 세션 데이터 저장소 (멀티 세션 메시지 보존)
  // ==========================================
  const chatSessionsData = {};
  const chatViewport = document.getElementById('chatViewport');

  function saveCurrentChatMessages(chatId) {
    if (!chatId) return;
    const messages = [];
    chatViewport.querySelectorAll('.chat-message').forEach(msgEl => {
      const isUser = msgEl.classList.contains('user-message');
      const thoughtEl = msgEl.querySelector('.thought-content');
      const textSpan = msgEl.querySelector('.message-text') || msgEl.querySelector('.message-body');
      const rawContent = msgEl.dataset.rawContent || (textSpan ? textSpan.innerText.trim() : '');
      messages.push({
        role: isUser ? 'user' : 'assistant',
        thought: thoughtEl ? thoughtEl.innerText.trim() : null,
        content: rawContent,
        rawContent: rawContent
      });
    });
    chatSessionsData[chatId] = messages;
  }

  function renderGuideMessage() {
    const msgEl = document.createElement('div');
    msgEl.className = 'chat-message assistant-message';
    msgEl.dataset.role = 'assistant';
    msgEl.dataset.rawContent = '미노리(MINORI) 시작 가이드';
    msgEl.innerHTML = `
      <div class="message-header-bar">
        <div class="message-sender-tag">
          <span class="sender-dot"></span>
          <span class="sender-name">MINORI</span>
        </div>
        <div class="message-actions">
          <button type="button" class="msg-action-btn action-tts-msg" title="가이드 음성으로 듣기">
            <svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
          </button>
          <button type="button" class="msg-action-btn danger action-del-msg" title="가이드 닫기">
            <svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
      </div>
      <div class="thought-container collapsed">
        <div class="thought-header">
          <span>White Thought (시스템 상태)</span>
          <span class="toggle-arrow">▶</span>
        </div>
        <div class="thought-content">
[시스템 초기화 완료]
- 에이전트: MINORI (자율형 개인 디지털 비서)
- 작업 공간: D:\\AIproject 연결 확인됨.
- 기능: 파일 시스템 I/O 도구, 음성 인식(STT), 음성 합성(TTS), 동적 모듈 제어
        </div>
      </div>
      <div class="message-body guide-message-body">
        <div style="font-size: 15px; font-weight: bold; margin-bottom: 8px; color: #a7f3d0;">
          안녕하세요, 주인님. 개인 디지털 비서 미노리(MINORI)입니다.
        </div>
        <p style="margin-bottom: 12px; color: var(--text-muted); font-size: 12px; line-height: 1.5;">
          미노리는 단순한 챗봇이 아닌, 로컬 PC 환경을 스스로 탐색하고 작업을 수행하는 자율형 비서입니다.<br>
          아래 안내를 참고하여 저와 작업을 시작해 보세요.
        </p>
        
        <div class="guide-grid">
          <div class="guide-card">
            <div class="guide-badge">1. API 설정</div>
            <div class="guide-text">
              좌측 상단 <b>[설정] 탭 ➔ 고급 설정</b>에서 Google Gemini API 키를 입력하고 <b>[연결 테스트]</b>를 진행해 주세요.
            </div>
          </div>

          <div class="guide-card">
            <div class="guide-badge">2. 음성 대화 (STT/TTS)</div>
            <div class="guide-text">
              하단 입력창 우측의 <b>마이크 버튼</b>을 누르고 말씀하시면 실시간 음성 인식 후 자동 전송됩니다. <b>[TTS 설정]</b>에서 자동 음성 재생을 켤 수 있습니다.
            </div>
          </div>

          <div class="guide-card">
            <div class="guide-badge">3. 자율 도구 실행</div>
            <div class="guide-text">
              로컬 작업 공간에서 다음과 같은 명령을 자연어로 내려보세요:<br>
              • <code>"지금 몇 시야?"</code> (시스템 시각 조회)<br>
              • <code>"작업 공간에 어떤 파일들이 있어?"</code> (디렉터리 파일 탐색)<br>
              • <code>"Test 폴더의 ApiTest.py 내용 요약해줘"</code> (파일 읽기 및 분석)<br>
              • <code>"오늘 회의록 양식을 meeting_template.md 파일로 작성해줘"</code> (파일 생성)
            </div>
          </div>

          <div class="guide-card">
            <div class="guide-badge">4. 모듈 및 대화 관리</div>
            <div class="guide-text">
              좌측 사이드바 <b>[모듈 설정]</b> 또는 <b>[설정 ➔ 모듈 관리]</b>에서 원하는 규칙을 직접 추가/편집할 수 있습니다. 각 대화 말풍선 상단 우측의 <b>[편집] [리롤] [삭제]</b> 버튼을 상시 이용할 수 있습니다.
            </div>
          </div>
        </div>

        <div style="margin-top: 12px; font-size: 12px; color: var(--text-accent);">
          무엇이든 편하게 말씀해 주세요, 주인님.
        </div>
      </div>
    `;
    chatViewport.appendChild(msgEl);
    return msgEl;
  }

  function loadChatMessages(chatId, chatTitle) {
    chatViewport.innerHTML = '';
    const messages = chatSessionsData[chatId];
    if (messages && messages.length > 0) {
      messages.forEach(msg => {
        renderMessageToViewport(msg.role, msg.content, msg.thought, msg.rawContent);
      });
    } else {
      renderGuideMessage();
    }
    chatViewport.scrollTop = chatViewport.scrollHeight;
  }

  function renderMessageToViewport(role, content, thought, rawContent) {
    const msgEl = document.createElement('div');
    msgEl.className = `chat-message ${role === 'user' ? 'user-message' : 'assistant-message'}`;
    const origText = (rawContent !== undefined && rawContent !== null) ? rawContent : content;
    msgEl.dataset.rawContent = origText;
    msgEl.dataset.role = role;

    let thoughtHtml = '';
    if (thought) {
      thoughtHtml = `
        <div class="thought-container collapsed">
          <div class="thought-header">
            <span>White Thought (사고 및 도구 로그)</span>
            <span class="toggle-arrow">▶</span>
          </div>
          <div class="thought-content">${escapeHtml(thought)}</div>
        </div>
      `;
    }

    let displayContent = applyRegexPipeline(content, 'display');
    displayContent = parseTriggerButtons(escapeHtml(displayContent));

    const isUser = role === 'user';
    const senderName = isUser ? '주인님' : 'MINORI';

    let actionBtnsHtml = '';
    if (isUser) {
      actionBtnsHtml = `
        <div class="message-actions">
          <button type="button" class="msg-action-btn action-edit-msg" title="메시지 편집">
            <svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          </button>
          <button type="button" class="msg-action-btn danger action-del-msg" title="메시지 삭제">
            <svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </div>
      `;
      msgEl.innerHTML = `
        <div class="message-header-bar">
          <div class="message-sender-tag">
            <span class="sender-dot"></span>
            <span class="sender-name">${senderName}</span>
          </div>
          ${actionBtnsHtml}
        </div>
        <div class="message-body" style="color: #7aa2f7;"><span class="message-text">${displayContent}</span></div>
      `;
    } else {
      actionBtnsHtml = `
        <div class="message-actions">
          <button type="button" class="msg-action-btn action-reroll-msg" title="답변 재생성 (리롤)">
            <svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
          </button>
          <button type="button" class="msg-action-btn action-edit-msg" title="답변 편집">
            <svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          </button>
          <button type="button" class="msg-action-btn action-tts-msg" title="음성 듣기">
            <svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
          </button>
          <button type="button" class="msg-action-btn danger action-del-msg" title="답변 삭제">
            <svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </div>
      `;
      msgEl.innerHTML = `
        <div class="message-header-bar">
          <div class="message-sender-tag">
            <span class="sender-dot"></span>
            <span class="sender-name">${senderName}</span>
          </div>
          ${actionBtnsHtml}
        </div>
        ${thoughtHtml}
        <div class="message-body"><span class="message-text">${displayContent}</span></div>
      `;
    }

    chatViewport.appendChild(msgEl);
    return msgEl;
  }

  // 메시지 액션 (편집, 삭제, 리롤, TTS) 및 White thought 이벤트 위임 핸들러
  chatViewport.addEventListener('click', async (e) => {
    // 1. White thought 토글
    const thoughtHeader = e.target.closest('.thought-header');
    if (thoughtHeader) {
      const thoughtContainer = thoughtHeader.closest('.thought-container');
      if (thoughtContainer) thoughtContainer.classList.toggle('collapsed');
      return;
    }

    // 2. 메시지 삭제 (Delete)
    const delBtn = e.target.closest('.action-del-msg');
    if (delBtn) {
      const msgEl = delBtn.closest('.chat-message');
      if (msgEl) {
        msgEl.remove();
        const ctx = getActiveChatContext();
        saveCurrentChatMessages(ctx.chatId);
      }
      return;
    }

    // 3. 메시지 편집 (Edit)
    const editBtn = e.target.closest('.action-edit-msg');
    if (editBtn) {
      const msgEl = editBtn.closest('.chat-message');
      if (!msgEl || msgEl.querySelector('.inline-edit-box')) return;

      const bodyEl = msgEl.querySelector('.message-body');
      const textSpan = msgEl.querySelector('.message-text');
      const currentRaw = msgEl.dataset.rawContent || (textSpan ? textSpan.innerText : '');
      const isUser = msgEl.dataset.role === 'user';

      const editBox = document.createElement('div');
      editBox.className = 'inline-edit-box';
      editBox.innerHTML = `
        <textarea class="inline-edit-textarea" rows="3">${escapeHtml(currentRaw)}</textarea>
        <div class="inline-edit-actions">
          <button type="button" class="btn-solid-secondary btn-cancel-edit" style="padding: 4px 10px; font-size: 11px;">취소</button>
          <button type="button" class="btn-solid-primary btn-save-edit" style="padding: 4px 10px; font-size: 11px;">저장</button>
        </div>
      `;

      if (bodyEl) bodyEl.style.display = 'none';
      msgEl.appendChild(editBox);

      const textarea = editBox.querySelector('.inline-edit-textarea');
      textarea.focus();

      editBox.querySelector('.btn-cancel-edit').onclick = () => {
        editBox.remove();
        if (bodyEl) bodyEl.style.display = '';
      };

      editBox.querySelector('.btn-save-edit').onclick = () => {
        const newText = textarea.value.trim();
        msgEl.dataset.rawContent = newText;
        let modified = applyRegexPipeline(newText, 'display');
        modified = parseTriggerButtons(escapeHtml(modified));
        if (textSpan) {
          textSpan.innerHTML = modified;
        } else if (bodyEl) {
          bodyEl.innerHTML = (isUser ? '<b>주인님:</b> ' : '') + `<span class="message-text">${modified}</span>`;
        }
        editBox.remove();
        if (bodyEl) bodyEl.style.display = '';
        const ctx = getActiveChatContext();
        saveCurrentChatMessages(ctx.chatId);
      };
      return;
    }

    // 4. 음성 듣기 (TTS)
    const ttsBtn = e.target.closest('.action-tts-msg');
    if (ttsBtn) {
      const msgEl = ttsBtn.closest('.chat-message');
      if (msgEl) {
        const textSpan = msgEl.querySelector('.message-text') || msgEl.querySelector('.message-body');
        if (textSpan) speakMessage(textSpan.innerText);
      }
      return;
    }

    // 5. 리롤 / 답변 재생성 (Reroll)
    const rerollBtn = e.target.closest('.action-reroll-msg');
    if (rerollBtn) {
      const assistantMsgEl = rerollBtn.closest('.chat-message');
      if (!assistantMsgEl) return;

      let prevEl = assistantMsgEl.previousElementSibling;
      let userPrompt = '';
      while (prevEl) {
        if (prevEl.classList.contains('user-message')) {
          userPrompt = prevEl.dataset.rawContent || (prevEl.querySelector('.message-text') ? prevEl.querySelector('.message-text').innerText : '');
          break;
        }
        prevEl = prevEl.previousElementSibling;
      }

      if (!userPrompt) {
        showToast('이전 사용자 질문을 찾을 수 없어 리롤할 수 없습니다.', 'warn');
        return;
      }

      rerollBtn.disabled = true;
      const rerollSvg = '<svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>';
      rerollBtn.innerHTML = '<svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>';
      const textSpan = assistantMsgEl.querySelector('.message-text') || assistantMsgEl.querySelector('.message-body');
      const originalText = textSpan ? textSpan.innerHTML : '';
      if (textSpan) textSpan.innerHTML = '<em>미노리가 다시 생각하고 있습니다...</em>';

      try {
        const ctx = getActiveChatContext();
        const activeModulesRules = typeof getActiveModulePrompts === 'function' ? getActiveModulePrompts() : '';

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userPrompt,
            chat_id: ctx.chatId,
            system_rules: activeModulesRules
          })
        });

        if (!response.ok) throw new Error(`서버 오류 (${response.status})`);
        const data = await response.json();

        let modifiedReply = applyRegexPipeline(data.reply || '', 'output');
        assistantMsgEl.dataset.rawContent = data.reply || '';

        let thoughtContentEl = assistantMsgEl.querySelector('.thought-content');
        if (data.thoughts && thoughtContentEl) {
          thoughtContentEl.textContent = data.thoughts;
        }

        let displayContent = applyRegexPipeline(modifiedReply, 'display');
        displayContent = parseTriggerButtons(escapeHtml(displayContent));
        if (textSpan) textSpan.innerHTML = displayContent;

        const ctxSave = getActiveChatContext();
        saveCurrentChatMessages(ctxSave.chatId);

        if (ttsSettings && ttsSettings.autoPlay) {
          speakMessage(modifiedReply);
        }
      } catch (err) {
        showToast('리롤 실패: ' + err.message, 'error');
        if (textSpan) textSpan.innerHTML = originalText;
      } finally {
        rerollBtn.disabled = false;
        rerollBtn.innerHTML = rerollSvg;
      }
      return;
    }
  });

  // 버튼 트리거 파서: {{button::Display::TriggerName}} -> <button class="btn-trigger-action" risu-trigger="TriggerName">Display</button>
  function parseTriggerButtons(html) {
    return html.replace(/\{\{button::(.*?)::(.*?)\}\}/g, (_, label, triggerName) => {
      const cleanLabel = label.trim();
      const cleanTrigger = triggerName.trim();
      return `<button type="button" class="btn-trigger-action" risu-trigger="${cleanTrigger}"><svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg><span>${cleanLabel}</span></button>`;
    });
  }

  // 클릭 이벤트 위임으로 모든 [risu-trigger] 버튼 핸들링
  document.addEventListener('click', (e) => {
    const triggerBtn = e.target.closest('[risu-trigger]');
    if (triggerBtn) {
      e.stopPropagation();
      const triggerName = triggerBtn.getAttribute('risu-trigger');
      executeTrigger(triggerName);
    }
  });

  const initialActiveItem = document.querySelector('.session-item.active');
  if (initialActiveItem) {
    saveCurrentChatMessages(initialActiveItem.dataset.chatId);
  }

  // ==========================================
  // 5. 채팅 드래그 앤 드롭 및 리스트 관리
  // (폴더에 넣기, 빼내기, 폴더에 폴더 넣기는 엄격 차단)
  // ==========================================
  const sessionTree = document.getElementById('sessionTree');
  let draggedSessionItem = null;

  function setupChatDrag(item) {
    item.setAttribute('draggable', 'true');

    item.addEventListener('dragstart', (e) => {
      e.stopPropagation();
      draggedSessionItem = item;
      e.dataTransfer.setData('text/plain', item.dataset.chatId || '');
      e.dataTransfer.effectAllowed = 'move';
      item.classList.add('dragging');
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      clearAllDragHoverIndicators();
      draggedSessionItem = null;
    });

    item.addEventListener('dragover', (e) => {
      if (!draggedSessionItem || draggedSessionItem === item) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = item.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        item.classList.add('drag-insert-before');
        item.classList.remove('drag-insert-after');
      } else {
        item.classList.add('drag-insert-after');
        item.classList.remove('drag-insert-before');
      }
    });

    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-insert-before', 'drag-insert-after');
    });

    item.addEventListener('drop', (e) => {
      if (!draggedSessionItem || draggedSessionItem === item) return;
      e.preventDefault();
      e.stopPropagation();
      if (item.classList.contains('drag-insert-before')) {
        item.parentNode.insertBefore(draggedSessionItem, item);
      } else {
        item.parentNode.insertBefore(draggedSessionItem, item.nextSibling);
      }
      clearAllDragHoverIndicators();
      updateScopeBannerText();
    });
  }

  function setupNoteGroupDrop(noteGroup) {
    noteGroup.addEventListener('dragover', (e) => {
      if (!draggedSessionItem || !draggedSessionItem.classList.contains('session-item')) return;
      e.preventDefault();
      e.stopPropagation();
      noteGroup.classList.add('drag-target-hover');
    });

    noteGroup.addEventListener('dragleave', (e) => {
      if (!noteGroup.contains(e.relatedTarget)) {
        noteGroup.classList.remove('drag-target-hover');
      }
    });

    noteGroup.addEventListener('drop', (e) => {
      if (!draggedSessionItem || !draggedSessionItem.classList.contains('session-item')) return;
      e.preventDefault();
      e.stopPropagation();
      noteGroup.classList.remove('drag-target-hover');

      const chatList = noteGroup.querySelector('.note-chat-list');
      if (chatList && !chatList.contains(draggedSessionItem)) {
        chatList.appendChild(draggedSessionItem);
        noteGroup.classList.remove('collapsed');
      }
      clearAllDragHoverIndicators();
      updateScopeBannerText();
    });
  }

  function setupRootChatListDrop(rootList) {
    rootList.addEventListener('dragover', (e) => {
      if (!draggedSessionItem || !draggedSessionItem.classList.contains('session-item')) return;
      e.preventDefault();
      e.stopPropagation();
      rootList.classList.add('drag-target-hover');
    });

    rootList.addEventListener('dragleave', (e) => {
      if (!rootList.contains(e.relatedTarget)) {
        rootList.classList.remove('drag-target-hover');
      }
    });

    rootList.addEventListener('drop', (e) => {
      if (!draggedSessionItem || !draggedSessionItem.classList.contains('session-item')) return;
      e.preventDefault();
      e.stopPropagation();
      rootList.classList.remove('drag-target-hover');

      if (!rootList.contains(draggedSessionItem)) {
        rootList.appendChild(draggedSessionItem);
      }
      clearAllDragHoverIndicators();
      updateScopeBannerText();
    });
  }

  function clearAllDragHoverIndicators() {
    document.querySelectorAll('.drag-target-hover, .drag-insert-before, .drag-insert-after').forEach(el => {
      el.classList.remove('drag-target-hover', 'drag-insert-before', 'drag-insert-after');
    });
  }

  sessionTree.addEventListener('dragover', (e) => {
    if (!draggedSessionItem || !draggedSessionItem.classList.contains('session-item')) return;
    if (e.target === sessionTree) {
      e.preventDefault();
      sessionTree.classList.add('drag-target-hover');
    }
  });

  sessionTree.addEventListener('dragleave', (e) => {
    if (e.target === sessionTree) {
      sessionTree.classList.remove('drag-target-hover');
    }
  });

  sessionTree.addEventListener('drop', (e) => {
    if (!draggedSessionItem || !draggedSessionItem.classList.contains('session-item')) return;
    if (e.target === sessionTree) {
      e.preventDefault();
      sessionTree.classList.remove('drag-target-hover');
      const rootList = sessionTree.querySelector('.root-chat-list');
      if (rootList) rootList.appendChild(draggedSessionItem);
      clearAllDragHoverIndicators();
      updateScopeBannerText();
    }
  });

  document.querySelectorAll('.session-item').forEach(setupChatDrag);
  document.querySelectorAll('.note-group').forEach(setupNoteGroupDrop);
  const rootChatList = document.querySelector('.root-chat-list');
  if (rootChatList) setupRootChatListDrop(rootChatList);

  const createSessionItem = (name, chatId) => {
    const item = document.createElement('li');
    item.className = 'session-item';
    item.dataset.chatId = chatId;
    item.setAttribute('draggable', 'true');
    item.innerHTML = `
      <span class="session-name" title="클릭 시 활성화 / 수정 가능"></span>
      <div class="item-actions">
        <button class="btn-icon-action action-edit" title="제목 수정">
          <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        </button>
        <button class="btn-icon-action action-export" title="대화 내보내기">
          <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
        </button>
        <button class="btn-icon-action action-import" title="대화 덮어쓰기/불러오기">
          <svg viewBox="0 0 24 24"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
        </button>
        <button class="btn-icon-action danger action-delete" title="채팅 삭제">
          <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>
      </div>`;
    item.querySelector('.session-name').textContent = name;
    setupChatDrag(item);
    return item;
  };

  const addChat = (container) => {
    showModalPrompt('새 대화 생성', '새 대화 제목을 입력하세요', '새 대화', (name) => {
      if (!name) return;
      const newChatId = `chat_${Date.now()}`;
      const item = createSessionItem(name.trim(), newChatId);
      container.appendChild(item);
      switchActiveChat(item);
      showToast(`'${name.trim()}' 대화가 생성되었습니다.`, 'success');
    });
  };

  function switchActiveChat(targetItem) {
    saveCurrentLorebookDOMToStore();

    const currentActive = sessionTree.querySelector('.session-item.active');
    if (currentActive) {
      saveCurrentChatMessages(currentActive.dataset.chatId);
      currentActive.classList.remove('active');
    }
    targetItem.classList.add('active');
    const title = targetItem.querySelector('.session-name').textContent.trim();
    loadChatMessages(targetItem.dataset.chatId, title);

    renderLorebookView();
  }

  document.getElementById('btnNewChat').addEventListener('click', () => {
    const rootList = document.querySelector('.root-chat-list') || sessionTree;
    addChat(rootList);
  });

  document.getElementById('btnNewNote').addEventListener('click', () => {
    showModalPrompt('새 노트(폴더) 생성', '새 노트(폴더) 이름을 입력하세요', '새 노트', (name) => {
      if (!name) return;
      const note = document.createElement('div');
      note.className = 'note-group';
      note.dataset.noteId = `note_${Date.now()}`;
      note.innerHTML = `
        <div class="note-header">
          <div class="note-header-left">
            <svg class="tree-arrow" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
            <svg class="icon-folder" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
            <span class="note-title"></span>
          </div>
          <div class="item-actions">
            <button class="btn-icon-action action-note-chat" title="노트 내 새 대화 추가">
              <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            </button>
            <button class="btn-icon-action danger action-note-delete" title="노트 삭제">
              <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
          </div>
        </div>
        <ul class="note-chat-list"></ul>
      `;
      note.querySelector('.note-title').textContent = name.trim();
      setupNoteGroupDrop(note);
      const rootList = sessionTree.querySelector('.root-chat-list');
      if (rootList) sessionTree.insertBefore(note, rootList);
      else sessionTree.appendChild(note);
      showToast(`'${name.trim()}' 노트가 생성되었습니다.`, 'success');
    });
  });

  // 개별 및 전체 채팅 내보내기/불러오기
  function exportSingleChat(chatItem) {
    const chatId = chatItem.dataset.chatId;
    const chatTitle = chatItem.querySelector('.session-name').textContent.trim();

    if (chatItem.classList.contains('active')) {
      saveCurrentChatMessages(chatId);
    }

    const messages = chatSessionsData[chatId] || [];
    const payload = {
      type: 'minori_single_chat',
      version: 1,
      id: chatId,
      title: chatTitle,
      exportedAt: new Date().toISOString(),
      messages: messages
    };

    const safeTitle = chatTitle.replace(/[\/\\:*?"<>|]/g, '_');
    downloadJson(`${safeTitle}_chat.json`, payload);
  }

  function importSingleChat(chatItem) {
    readJsonFile((data, filename) => {
      const chatId = chatItem.dataset.chatId;
      const title = data.title || data.name || filename.replace(/\.json$/i, '');
      const messages = Array.isArray(data.messages) ? data.messages : [];

      chatItem.querySelector('.session-name').textContent = title;
      chatSessionsData[chatId] = messages;

      if (chatItem.classList.contains('active')) {
        loadChatMessages(chatId, title);
      }
      showToast(`'${title}' 대화 세션을 성공적으로 불러왔습니다.`, 'success');
    });
  }

  const btnExportAllChats = document.getElementById('btnExportAllChats');
  if (btnExportAllChats) {
    btnExportAllChats.addEventListener('click', () => {
      const currentActive = sessionTree.querySelector('.session-item.active');
      if (currentActive) {
        saveCurrentChatMessages(currentActive.dataset.chatId);
      }

      const notes = [];
      sessionTree.querySelectorAll('.note-group').forEach(noteEl => {
        const noteId = noteEl.dataset.noteId || `note_${Date.now()}`;
        const noteTitle = noteEl.querySelector('.note-title').textContent.trim();
        const chats = [];
        noteEl.querySelectorAll('.session-item').forEach(chatEl => {
          const cId = chatEl.dataset.chatId;
          chats.push({
            id: cId,
            title: chatEl.querySelector('.session-name').textContent.trim(),
            messages: chatSessionsData[cId] || []
          });
        });
        notes.push({ id: noteId, title: noteTitle, chats: chats });
      });

      const rootChats = [];
      const rootList = sessionTree.querySelector('.root-chat-list');
      if (rootList) {
        rootList.querySelectorAll('.session-item').forEach(chatEl => {
          const cId = chatEl.dataset.chatId;
          rootChats.push({
            id: cId,
            title: chatEl.querySelector('.session-name').textContent.trim(),
            messages: chatSessionsData[cId] || []
          });
        });
      }

      const fullBackup = {
        type: 'minori_chat_backup',
        version: 1,
        exportedAt: new Date().toISOString(),
        notes: notes,
        rootChats: rootChats
      };

      downloadJson('minori_all_chats_backup.json', fullBackup);
      showToast('전체 대화 백업 파일이 다운로드되었습니다.', 'success');
    });
  }

  const btnImportChats = document.getElementById('btnImportChats');
  if (btnImportChats) {
    btnImportChats.addEventListener('click', () => {
      readJsonFile((data, filename) => {
        if (data.type === 'minori_chat_backup' && Array.isArray(data.notes)) {
          const performRestore = (replaceExisting) => {
            if (replaceExisting) {
              sessionTree.innerHTML = '<ul class="root-chat-list"></ul>';
            }
            const rootList = sessionTree.querySelector('.root-chat-list') || (() => {
              const ul = document.createElement('ul');
              ul.className = 'root-chat-list';
              sessionTree.appendChild(ul);
              return ul;
            })();
            setupRootChatListDrop(rootList);

            data.notes.forEach(noteData => {
              const note = document.createElement('div');
              note.className = 'note-group';
              note.dataset.noteId = noteData.id || `note_${Date.now()}`;
              note.innerHTML = `
                <div class="note-header">
                  <div class="note-header-left">
                    <svg class="tree-arrow" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
                    <svg class="icon-folder" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
                    <span class="note-title"></span>
                  </div>
                  <div class="item-actions">
                    <button class="btn-icon-action action-note-chat" title="노트 내 새 대화 추가">
                      <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                    </button>
                    <button class="btn-icon-action danger action-note-delete" title="노트 삭제">
                      <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                  </div>
                </div>
                <ul class="note-chat-list"></ul>
              `;
              note.querySelector('.note-title').textContent = noteData.title || '복원된 노트';
              setupNoteGroupDrop(note);

              const chatList = note.querySelector('.note-chat-list');
              if (Array.isArray(noteData.chats)) {
                noteData.chats.forEach(c => {
                  const item = createSessionItem(c.title || '복원된 대화', c.id || `chat_${Date.now()}`);
                  chatList.appendChild(item);
                  chatSessionsData[item.dataset.chatId] = c.messages || [];
                });
              }
              sessionTree.insertBefore(note, rootList);
            });

            if (Array.isArray(data.rootChats)) {
              data.rootChats.forEach(c => {
                const item = createSessionItem(c.title || '복원된 대화', c.id || `chat_${Date.now()}`);
                rootList.appendChild(item);
                chatSessionsData[item.dataset.chatId] = c.messages || [];
              });
            }

            showToast('전체 대화 백업을 성공적으로 불러왔습니다.', 'success');
          };

          showModalConfirm('백업 복원 옵션', '기존 채팅 목록을 유지한 채 추가하시겠습니까? (취소 시 기존 목록을 완전히 교체합니다)', () => {
            performRestore(false);
          });
          return;
        }

        const rootList = sessionTree.querySelector('.root-chat-list') || sessionTree;
        const newChatId = data.id || `chat_${Date.now()}`;
        const title = data.title || data.name || filename.replace(/\.json$/i, '');
        const item = createSessionItem(title, newChatId);
        rootList.appendChild(item);
        chatSessionsData[newChatId] = Array.isArray(data.messages) ? data.messages : [];
        switchActiveChat(item);
        showToast(`'${title}' 대화를 성공적으로 추가했습니다.`, 'success');
      });
    });
  }

  sessionTree.addEventListener('click', (e) => {
    const noteHeaderLeft = e.target.closest('.note-header-left');
    if (noteHeaderLeft) {
      noteHeaderLeft.closest('.note-group').classList.toggle('collapsed');
      return;
    }

    const noteChatButton = e.target.closest('.action-note-chat');
    if (noteChatButton) {
      e.stopPropagation();
      addChat(noteChatButton.closest('.note-group').querySelector('.note-chat-list'));
      return;
    }

    const noteDeleteButton = e.target.closest('.action-note-delete');
    if (noteDeleteButton) {
      e.stopPropagation();
      const note = noteDeleteButton.closest('.note-group');
      const noteTitle = note.querySelector('.note-title').textContent.trim();
      showModalConfirm('노트 삭제 확인', `'${noteTitle}' 노트를 삭제하시겠습니까? (하위 대화도 함께 삭제됩니다)`, () => {
        note.querySelectorAll('.session-item').forEach(c => delete chatSessionsData[c.dataset.chatId]);
        note.remove();
        renderLorebookView();
        showToast(`'${noteTitle}' 노트가 삭제되었습니다.`, 'info');
      });
      return;
    }

    const editButton = e.target.closest('.action-edit');
    if (editButton) {
      e.stopPropagation();
      const nameSpan = editButton.closest('.session-item').querySelector('.session-name');
      showModalPrompt('대화 제목 수정', '대화 제목을 입력하세요', nameSpan.textContent.trim(), (newName) => {
        if (newName && newName.trim()) {
          nameSpan.textContent = newName.trim();
          updateScopeBannerText();
          showToast('대화 제목이 수정되었습니다.', 'success');
        }
      });
      return;
    }

    const exportButton = e.target.closest('.action-export');
    if (exportButton) {
      e.stopPropagation();
      exportSingleChat(exportButton.closest('.session-item'));
      return;
    }

    const importButton = e.target.closest('.action-import');
    if (importButton) {
      e.stopPropagation();
      importSingleChat(importButton.closest('.session-item'));
      return;
    }

    const deleteButton = e.target.closest('.action-delete');
    if (deleteButton) {
      e.stopPropagation();
      const item = deleteButton.closest('.session-item');
      const chatTitle = item.querySelector('.session-name').textContent.trim();
      showModalConfirm('대화 삭제 확인', `'${chatTitle}' 대화를 삭제하시겠습니까?`, () => {
        delete chatSessionsData[item.dataset.chatId];
        const wasActive = item.classList.contains('active');
        item.remove();
        if (wasActive) {
          const nextActive = sessionTree.querySelector('.session-item');
          if (nextActive) switchActiveChat(nextActive);
          else chatViewport.innerHTML = '';
        }
        renderLorebookView();
        showToast(`'${chatTitle}' 대화가 삭제되었습니다.`, 'info');
      });
      return;
    }

    const sessionItem = e.target.closest('.session-item');
    if (sessionItem && !sessionItem.classList.contains('active')) {
      switchActiveChat(sessionItem);
    }
  });

  // ==========================================
  // 6. 로어북 파트 ([노트] vs [채팅] 스코프 및 [설정] 최대 토큰)
  // ==========================================
  let currentLbTab = 'note';
  const lorebookCardList = document.getElementById('lorebookCardList');
  const lorebookConfigView = document.getElementById('lorebookConfigView');
  const lorebookActionBar = document.getElementById('lorebookActionBar');
  const lbScopeIcon = document.getElementById('lbScopeIcon');
  const lbScopeText = document.getElementById('lbScopeText');
  const lbMaxTokens = document.getElementById('lbMaxTokens');
  const btnSaveLbConfig = document.getElementById('btnSaveLbConfig');

  const lorebookStore = {
    notes: {
      'note_work': {
        folders: [
          {
            id: 'lb_folder_custom',
            name: '커스텀 로어북',
            entries: [
              {
                id: 'lb_note_001',
                name: '프로젝트 개발 표준 가이드',
                keys: '에코, 프로젝트, 개발, 아두이노',
                order: 100,
                prompt: '업무 & 개발 노트 전체에 적용되는 코딩 표준 및 시스템 아키텍처 규칙입니다.',
                alwaysActive: true,
                multipleKeys: false,
                useRegex: false,
                active: true
              }
            ]
          }
        ],
        rootEntries: []
      }
    },
    chats: {
      'chat_001': {
        folders: [],
        rootEntries: [
          {
            id: 'lb_chat_001',
            name: '에코 센터 기획 전용 지침',
            keys: '기획, 일정, 마일스톤',
            order: 120,
            prompt: '에코 센터 프로젝트 기획 세션에서만 적용되는 세부 기획 메모 및 요구사항입니다.',
            alwaysActive: false,
            multipleKeys: false,
            useRegex: false,
            active: true
          }
        ]
      }
    },
    config: {
      maxTokens: Number(localStorage.getItem('minoriLbMaxTokens') || 1000)
    }
  };

  if (lbMaxTokens) lbMaxTokens.value = lorebookStore.config.maxTokens;

  function getActiveChatContext() {
    const activeItem = sessionTree.querySelector('.session-item.active');
    if (!activeItem) {
      return { chatId: 'default_chat', chatTitle: '기본 대화', noteId: null, noteTitle: null };
    }
    const chatId = activeItem.dataset.chatId;
    const chatTitle = activeItem.querySelector('.session-name').textContent.trim();
    const parentNote = activeItem.closest('.note-group');
    const noteId = parentNote ? (parentNote.dataset.noteId || 'default_note') : null;
    const noteTitle = parentNote ? parentNote.querySelector('.note-title').textContent.trim() : null;
    return { chatId, chatTitle, noteId, noteTitle };
  }

  function updateScopeBannerText() {
    const ctx = getActiveChatContext();
    if (currentLbTab === 'note') {
      if (lbScopeIcon) lbScopeIcon.innerHTML = '<svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>';
      if (lbScopeText) {
        lbScopeText.textContent = ctx.noteId
          ? `적용 범위: [${ctx.noteTitle}] 노트 전체 (소속된 모든 대화에 공통 적용)`
          : `적용 범위: [루트 대화] (특정 노트에 묶이지 않은 대화)`;
      }
    } else if (currentLbTab === 'chat') {
      if (lbScopeIcon) lbScopeIcon.innerHTML = '<svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';
      if (lbScopeText) lbScopeText.textContent = `적용 범위: [${ctx.chatTitle}] (해당 대화에만 단독 적용)`;
    } else if (currentLbTab === 'config') {
      if (lbScopeIcon) lbScopeIcon.innerHTML = '<svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>';
      if (lbScopeText) lbScopeText.textContent = `로어북 글로벌 설정 (최대 허용 토큰 및 무시 조건 제어)`;
    }
  }

  function saveCurrentLorebookDOMToStore() {
    if (currentLbTab === 'config') return;

    const ctx = getActiveChatContext();
    const scopeKey = currentLbTab === 'note' ? (ctx.noteId || 'root_note') : ctx.chatId;
    const targetStore = currentLbTab === 'note' ? lorebookStore.notes : lorebookStore.chats;

    const folders = [];
    lorebookCardList.querySelectorAll('.lb-folder-group').forEach(f => {
      const folderId = f.dataset.folderId;
      const folderName = f.querySelector('.lb-folder-title').textContent.trim();
      const entries = [];
      f.querySelectorAll('.lorebook-editor-card').forEach(c => {
        entries.push(extractCardData(c));
      });
      folders.push({ id: folderId, name: folderName, entries: entries });
    });

    const rootEntries = [];
    const rootList = document.getElementById('rootLbList');
    if (rootList) {
      rootList.querySelectorAll('.lorebook-editor-card').forEach(c => {
        rootEntries.push(extractCardData(c));
      });
    }

    targetStore[scopeKey] = { folders, rootEntries };
  }

  function renderLorebookView() {
    updateScopeBannerText();

    if (currentLbTab === 'config') {
      lorebookCardList.style.display = 'none';
      lorebookActionBar.style.display = 'none';
      lorebookConfigView.style.display = 'flex';
      updateConfigSummary();
      return;
    }

    lorebookCardList.style.display = 'flex';
    lorebookActionBar.style.display = 'flex';
    lorebookConfigView.style.display = 'none';

    lorebookCardList.innerHTML = '<div class="root-lb-list" id="rootLbList"></div>';
    const rootList = document.getElementById('rootLbList');
    setupRootLbDrop(rootList);

    const ctx = getActiveChatContext();
    const scopeKey = currentLbTab === 'note' ? (ctx.noteId || 'root_note') : ctx.chatId;
    const targetStore = currentLbTab === 'note' ? lorebookStore.notes : lorebookStore.chats;
    const data = targetStore[scopeKey] || { folders: [], rootEntries: [] };

    (data.folders || []).forEach(f => {
      const folder = createLorebookFolder(f.name || '폴더', f.id);
      const cardsBox = folder.querySelector('.lb-folder-cards');
      (f.entries || []).forEach(entry => {
        cardsBox.appendChild(createLorebookCard(entry));
      });
      lorebookCardList.insertBefore(folder, rootList);
    });

    (data.rootEntries || []).forEach(entry => {
      rootList.appendChild(createLorebookCard(entry));
    });
  }

  function updateConfigSummary() {
    const ctx = getActiveChatContext();
    const noteData = (ctx.noteId && lorebookStore.notes[ctx.noteId]) ? lorebookStore.notes[ctx.noteId] : (lorebookStore.notes['root_note'] || { folders: [], rootEntries: [] });
    const chatData = lorebookStore.chats[ctx.chatId] || { folders: [], rootEntries: [] };

    let noteCount = (noteData.rootEntries || []).length;
    (noteData.folders || []).forEach(f => { noteCount += (f.entries || []).length; });

    let chatCount = (chatData.rootEntries || []).length;
    (chatData.folders || []).forEach(f => { chatCount += (f.entries || []).length; });

    let totalTokens = 0;
    const countTokens = (list) => {
      (list || []).forEach(e => {
        if (e.active !== false && e.prompt) {
          totalTokens += Math.ceil(e.prompt.length / 2);
        }
      });
    };
    countTokens(noteData.rootEntries);
    (noteData.folders || []).forEach(f => countTokens(f.entries));
    countTokens(chatData.rootEntries);
    (chatData.folders || []).forEach(f => countTokens(f.entries));

    const maxT = lorebookStore.config.maxTokens || 1000;
    const summaryNoteLbCount = document.getElementById('summaryNoteLbCount');
    const summaryChatLbCount = document.getElementById('summaryChatLbCount');
    const summaryEstTokens = document.getElementById('summaryEstTokens');
    const summaryMaxTokens = document.getElementById('summaryMaxTokens');

    if (summaryNoteLbCount) summaryNoteLbCount.textContent = noteCount;
    if (summaryChatLbCount) summaryChatLbCount.textContent = chatCount;
    if (summaryEstTokens) summaryEstTokens.textContent = totalTokens;
    if (summaryMaxTokens) summaryMaxTokens.textContent = maxT;
  }

  const subTabBtns = document.querySelectorAll('.sub-tab-btn');
  subTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      saveCurrentLorebookDOMToStore();
      subTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (btn.id === 'tabLbNote') currentLbTab = 'note';
      else if (btn.id === 'tabLbChat') currentLbTab = 'chat';
      else if (btn.id === 'tabLbConfig') currentLbTab = 'config';

      renderLorebookView();
    });
  });

  if (btnSaveLbConfig && lbMaxTokens) {
    btnSaveLbConfig.addEventListener('click', () => {
      const val = Number(lbMaxTokens.value);
      if (isNaN(val) || val <= 0) {
        showToast('유효한 최대 토큰 수치를 입력해 주세요.', 'warn');
        return;
      }
      lorebookStore.config.maxTokens = val;
      localStorage.setItem('minoriLbMaxTokens', String(val));
      updateConfigSummary();
      showToast(`로어북 최대 토큰이 ${val} 토큰으로 저장되었습니다. (${val} 토큰 초과 로어북은 무시됨)`, 'success');
    });

    lbMaxTokens.addEventListener('input', () => {
      const val = Number(lbMaxTokens.value);
      if (!isNaN(val) && val > 0) {
        lorebookStore.config.maxTokens = val;
        localStorage.setItem('minoriLbMaxTokens', String(val));
        const summaryMaxTokens = document.getElementById('summaryMaxTokens');
        if (summaryMaxTokens) summaryMaxTokens.textContent = val;
      }
    });
  }

  let draggedLorebookCard = null;

  function setupLorebookDrag(card) {
    card.setAttribute('draggable', 'true');

    card.addEventListener('dragstart', (e) => {
      e.stopPropagation();
      draggedLorebookCard = card;
      e.dataTransfer.setData('text/plain', card.dataset.lbId || '');
      e.dataTransfer.effectAllowed = 'move';
      card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      clearAllDragHoverIndicators();
      draggedLorebookCard = null;
    });

    card.addEventListener('dragover', (e) => {
      if (!draggedLorebookCard || draggedLorebookCard === card) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = card.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        card.classList.add('drag-insert-before');
        card.classList.remove('drag-insert-after');
      } else {
        card.classList.add('drag-insert-after');
        card.classList.remove('drag-insert-before');
      }
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-insert-before', 'drag-insert-after');
    });

    card.addEventListener('drop', (e) => {
      if (!draggedLorebookCard || draggedLorebookCard === card) return;
      e.preventDefault();
      e.stopPropagation();
      if (card.classList.contains('drag-insert-before')) {
        card.parentNode.insertBefore(draggedLorebookCard, card);
      } else {
        card.parentNode.insertBefore(draggedLorebookCard, card.nextSibling);
      }
      clearAllDragHoverIndicators();
      saveCurrentLorebookDOMToStore();
    });
  }

  function setupLbFolderDrop(folderGroup) {
    folderGroup.addEventListener('dragover', (e) => {
      if (!draggedLorebookCard || !draggedLorebookCard.classList.contains('lorebook-editor-card')) return;
      e.preventDefault();
      e.stopPropagation();
      folderGroup.classList.add('drag-target-hover');
    });

    folderGroup.addEventListener('dragleave', (e) => {
      if (!folderGroup.contains(e.relatedTarget)) {
        folderGroup.classList.remove('drag-target-hover');
      }
    });

    folderGroup.addEventListener('drop', (e) => {
      if (!draggedLorebookCard || !draggedLorebookCard.classList.contains('lorebook-editor-card')) return;
      e.preventDefault();
      e.stopPropagation();
      folderGroup.classList.remove('drag-target-hover');

      const cardContainer = folderGroup.querySelector('.lb-folder-cards');
      if (cardContainer && !cardContainer.contains(draggedLorebookCard)) {
        cardContainer.appendChild(draggedLorebookCard);
        folderGroup.classList.remove('collapsed');
      }
      clearAllDragHoverIndicators();
      saveCurrentLorebookDOMToStore();
    });
  }

  function setupRootLbDrop(rootLbListEl) {
    rootLbListEl.addEventListener('dragover', (e) => {
      if (!draggedLorebookCard || !draggedLorebookCard.classList.contains('lorebook-editor-card')) return;
      e.preventDefault();
      e.stopPropagation();
      rootLbListEl.classList.add('drag-target-hover');
    });

    rootLbListEl.addEventListener('dragleave', (e) => {
      if (!rootLbListEl.contains(e.relatedTarget)) {
        rootLbListEl.classList.remove('drag-target-hover');
      }
    });

    rootLbListEl.addEventListener('drop', (e) => {
      if (!draggedLorebookCard || !draggedLorebookCard.classList.contains('lorebook-editor-card')) return;
      e.preventDefault();
      e.stopPropagation();
      rootLbListEl.classList.remove('drag-target-hover');

      if (!rootLbListEl.contains(draggedLorebookCard)) {
        rootLbListEl.appendChild(draggedLorebookCard);
      }
      clearAllDragHoverIndicators();
      saveCurrentLorebookDOMToStore();
    });
  }

  function bindLorebookCardEvents(card) {
    const nameInput = card.querySelector('.lb-name-input');
    const titleSpan = card.querySelector('.entry-title');

    if (nameInput && titleSpan) {
      nameInput.addEventListener('input', () => {
        const val = nameInput.value.trim();
        titleSpan.textContent = val || '(이름 없음)';
        saveCurrentLorebookDOMToStore();
      });
    }

    const promptInput = card.querySelector('.lb-prompt-input');
    const tokenCounter = card.querySelector('.token-counter');
    if (promptInput && tokenCounter) {
      promptInput.addEventListener('input', () => {
        const text = promptInput.value || '';
        const estTokens = Math.ceil(text.length / 2);
        tokenCounter.textContent = `${estTokens} 토큰`;
        saveCurrentLorebookDOMToStore();
      });
    }

    setupLorebookDrag(card);
  }

  function createLorebookCard(entryData = {}) {
    const card = document.createElement('div');
    card.className = 'lorebook-editor-card collapsed';
    card.dataset.active = entryData.active !== false ? 'true' : 'false';
    card.dataset.lbId = entryData.id || `lb_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const name = entryData.name || '새 로어북';
    const keys = entryData.keys || '';
    const order = entryData.order !== undefined ? entryData.order : 100;
    const prompt = entryData.prompt || '';
    const alwaysActive = !!entryData.alwaysActive;
    const multipleKeys = !!entryData.multipleKeys;
    const useRegex = !!entryData.useRegex;
    const isActive = entryData.active !== false;

    card.innerHTML = `
      <div class="entry-card-body">
        <div class="entry-header">
          <div class="entry-header-left">
            <span class="fold-arrow">▶</span>
            <span class="entry-title">${escapeHtml(name)}</span>
          </div>
          <div class="entry-header-actions">
            <button class="icon-btn link-toggle-btn ${isActive ? 'active' : ''}" title="로어북 활성화/비활성화">
              <svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
            </button>
            <button class="icon-btn action-export-single-lb" title="이 로어북 내보내기">
              <svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
            </button>
            <button class="icon-btn action-delete-lb danger" title="로어북 삭제">
              <svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
          </div>
        </div>

        <div class="entry-content-collapsible">
          <div class="field-group">
            <div class="label-with-help">
              <label>이름</label>
              <span class="help-icon" title="로어북 식별명">?</span>
            </div>
            <input type="text" class="dark-input lb-name-input" value="${escapeHtml(name)}">
          </div>

          <div class="field-group">
            <div class="label-with-help">
              <label>활성화 키</label>
              <span class="help-icon" title="쉼표로 구분해 입력">?</span>
            </div>
            <input type="text" class="dark-input lb-keys-input" placeholder="','로 나눠주세요" value="${escapeHtml(keys)}">
          </div>

          <div class="field-group">
            <div class="label-with-help">
              <label>배치 순서</label>
              <span class="help-icon" title="프롬프트 주입 우선순위">?</span>
            </div>
            <input type="number" class="dark-input lb-order-input" value="${order}">
          </div>

          <div class="field-group">
            <label>프롬프트</label>
            <textarea class="dark-textarea lb-prompt-input" rows="5" placeholder="주입될 프롬프트 내용을 작성하세요.">${escapeHtml(prompt)}</textarea>
            <div class="token-counter">${Math.ceil(prompt.length / 2)} 토큰</div>
          </div>

          <div class="checkbox-group">
            <label class="custom-checkbox">
              <input type="checkbox" class="lb-always-active" ${alwaysActive ? 'checked' : ''}>
              <span class="checkmark"></span>
              <span class="check-text">언제나 활성화</span>
            </label>
            <label class="custom-checkbox">
              <input type="checkbox" class="lb-multi-key" ${multipleKeys ? 'checked' : ''}>
              <span class="checkmark"></span>
              <span class="check-text">멀티플 키</span>
              <span class="help-icon-sm" title="모든 키가 문맥에 존재해야 활성화">?</span>
            </label>
            <label class="custom-checkbox">
              <input type="checkbox" class="lb-regex" ${useRegex ? 'checked' : ''}>
              <span class="checkmark"></span>
              <span class="check-text">정규식 사용</span>
              <span class="help-icon-sm" title="정규식 파싱">?</span>
            </label>
          </div>
        </div>
      </div>
    `;

    bindLorebookCardEvents(card);
    return card;
  }

  function createLorebookFolder(folderName, folderId) {
    const folder = document.createElement('div');
    folder.className = 'lb-folder-group';
    folder.dataset.folderId = folderId || `lb_folder_${Date.now()}`;
    folder.innerHTML = `
      <div class="lb-folder-header">
        <div class="lb-folder-header-left">
          <svg class="tree-arrow" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
          <svg class="icon-folder" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
          <span class="lb-folder-title"></span>
        </div>
        <div class="item-actions">
          <button class="btn-icon-action action-add-card-to-folder" title="폴더에 새 로어북 추가">
            <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          </button>
          <button class="btn-icon-action action-edit-lb-folder" title="폴더 이름 수정">
            <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          </button>
          <button class="btn-icon-action danger action-delete-lb-folder" title="폴더 삭제">
            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </div>
      </div>
      <div class="lb-folder-cards"></div>
    `;
    folder.querySelector('.lb-folder-title').textContent = folderName;
    setupLbFolderDrop(folder);
    return folder;
  }

  function extractCardData(card) {
    return {
      id: card.dataset.lbId || `lb_${Date.now()}`,
      active: card.dataset.active !== 'false',
      name: card.querySelector('.lb-name-input') ? card.querySelector('.lb-name-input').value.trim() : card.querySelector('.entry-title').textContent.trim(),
      keys: card.querySelector('.lb-keys-input') ? card.querySelector('.lb-keys-input').value.trim() : '',
      order: card.querySelector('.lb-order-input') ? Number(card.querySelector('.lb-order-input').value) : 100,
      prompt: card.querySelector('.lb-prompt-input') ? card.querySelector('.lb-prompt-input').value : '',
      alwaysActive: card.querySelector('.lb-always-active') ? card.querySelector('.lb-always-active').checked : false,
      multipleKeys: card.querySelector('.lb-multi-key') ? card.querySelector('.lb-multi-key').checked : false,
      useRegex: card.querySelector('.lb-regex') ? card.querySelector('.lb-regex').checked : false
    };
  }

  const btnAddLb = document.getElementById('btnAddLb');
  if (btnAddLb) {
    btnAddLb.addEventListener('click', () => {
      const openFolder = lorebookCardList.querySelector('.lb-folder-group:not(.collapsed) .lb-folder-cards');
      const targetContainer = openFolder || document.getElementById('rootLbList') || lorebookCardList;
      const newCard = createLorebookCard({ name: '새 로어북' });
      targetContainer.appendChild(newCard);
      newCard.classList.remove('collapsed');
      const nameInput = newCard.querySelector('.lb-name-input');
      if (nameInput) {
        nameInput.focus();
        nameInput.select();
      }
      saveCurrentLorebookDOMToStore();
    });
  }

  const btnAddFolder = document.getElementById('btnAddFolder');
  if (btnAddFolder) {
    btnAddFolder.addEventListener('click', () => {
      showModalPrompt('새 로어북 폴더 생성', '새 로어북 폴더 이름을 입력하세요', '새 로어북 폴더', (name) => {
        if (!name || !name.trim()) return;
        const folder = createLorebookFolder(name.trim());
        const rootList = document.getElementById('rootLbList');
        if (rootList) {
          lorebookCardList.insertBefore(folder, rootList);
        } else {
          lorebookCardList.appendChild(folder);
        }
        saveCurrentLorebookDOMToStore();
        showToast(`'${name.trim()}' 폴더가 생성되었습니다.`, 'success');
      });
    });
  }

  const btnExportLb = document.getElementById('btnExportLb');
  if (btnExportLb) {
    btnExportLb.addEventListener('click', () => {
      saveCurrentLorebookDOMToStore();
      const ctx = getActiveChatContext();
      const scopeLabel = currentLbTab === 'note' ? `note_${ctx.noteTitle || 'general'}` : `chat_${ctx.chatTitle}`;

      const exportData = {
        type: 'minori_lorebook_backup',
        scope: currentLbTab,
        exportedAt: new Date().toISOString(),
        store: lorebookStore
      };

      downloadJson(`minori_${scopeLabel}_lorebooks.json`, exportData);
      showToast('로어북 데이터가 다운로드되었습니다.', 'success');
    });
  }

  const btnImportLb = document.getElementById('btnImportLb');
  if (btnImportLb) {
    btnImportLb.addEventListener('click', () => {
      readJsonFile((data, filename) => {
        if (data.type === 'minori_lorebook_backup' && data.store) {
          Object.assign(lorebookStore.notes, data.store.notes || {});
          Object.assign(lorebookStore.chats, data.store.chats || {});
          if (data.store.config) {
            lorebookStore.config.maxTokens = data.store.config.maxTokens || 1000;
            localStorage.setItem('minoriLbMaxTokens', String(lorebookStore.config.maxTokens));
            if (lbMaxTokens) lbMaxTokens.value = lorebookStore.config.maxTokens;
          }
          renderLorebookView();
          showToast(`전체 로어북 스토어를 복원했습니다. (${filename})`, 'success');
          return;
        }

        const list = Array.isArray(data.entries) ? data.entries : (Array.isArray(data) ? data : [data]);
        const entries = list.map(item => ({
          name: item.comment || item.name || '불러온 로어북',
          keys: Array.isArray(item.key) ? item.key.join(', ') : (item.keys || item.key || ''),
          order: item.order || item.insertion_order || 100,
          prompt: item.content || item.prompt || '',
          alwaysActive: !!item.alwaysActive,
          multipleKeys: !!item.selective,
          useRegex: !!item.useRegex,
          active: item.enabled !== false
        }));

        const rootList = document.getElementById('rootLbList') || lorebookCardList;
        entries.forEach(entry => {
          rootList.appendChild(createLorebookCard(entry));
        });
        saveCurrentLorebookDOMToStore();
        showToast(`${entries.length}개의 로어북을 불러왔습니다.`, 'success');
      });
    });
  }

  lorebookCardList.addEventListener('click', (e) => {
    const folderHeaderLeft = e.target.closest('.lb-folder-header-left');
    if (folderHeaderLeft) {
      folderHeaderLeft.closest('.lb-folder-group').classList.toggle('collapsed');
      return;
    }

    const addCardToFolderBtn = e.target.closest('.action-add-card-to-folder');
    if (addCardToFolderBtn) {
      e.stopPropagation();
      const folder = addCardToFolderBtn.closest('.lb-folder-group');
      folder.classList.remove('collapsed');
      const cardsBox = folder.querySelector('.lb-folder-cards');
      const newCard = createLorebookCard({ name: '새 로어북' });
      cardsBox.appendChild(newCard);
      newCard.classList.remove('collapsed');
      const nameInput = newCard.querySelector('.lb-name-input');
      if (nameInput) {
        nameInput.focus();
        nameInput.select();
      }
      saveCurrentLorebookDOMToStore();
      return;
    }

    const editFolderBtn = e.target.closest('.action-edit-lb-folder');
    if (editFolderBtn) {
      e.stopPropagation();
      const folder = editFolderBtn.closest('.lb-folder-group');
      const titleSpan = folder.querySelector('.lb-folder-title');
      showModalPrompt('로어북 폴더 이름 수정', '로어북 폴더 이름을 입력하세요', titleSpan.textContent.trim(), (newTitle) => {
        if (newTitle && newTitle.trim()) {
          titleSpan.textContent = newTitle.trim();
          saveCurrentLorebookDOMToStore();
          showToast('로어북 폴더 이름이 수정되었습니다.', 'success');
        }
      });
      return;
    }

    const deleteFolderBtn = e.target.closest('.action-delete-lb-folder');
    if (deleteFolderBtn) {
      e.stopPropagation();
      const folder = deleteFolderBtn.closest('.lb-folder-group');
      const title = folder.querySelector('.lb-folder-title').textContent.trim();
      showModalConfirm('폴더 삭제 확인', `'${title}' 로어북 폴더를 삭제하시겠습니까?`, () => {
        folder.remove();
        saveCurrentLorebookDOMToStore();
        showToast(`'${title}' 로어북 폴더가 삭제되었습니다.`, 'info');
      });
      return;
    }

    const linkBtn = e.target.closest('.link-toggle-btn');
    if (linkBtn) {
      e.stopPropagation();
      linkBtn.classList.toggle('active');
      const card = linkBtn.closest('.lorebook-editor-card');
      card.dataset.active = linkBtn.classList.contains('active') ? 'true' : 'false';
      saveCurrentLorebookDOMToStore();
      return;
    }

    const exportSingleBtn = e.target.closest('.action-export-single-lb');
    if (exportSingleBtn) {
      e.stopPropagation();
      const card = exportSingleBtn.closest('.lorebook-editor-card');
      const data = extractCardData(card);
      const safeName = data.name.replace(/[\/\\:*?"<>|]/g, '_');
      downloadJson(`${safeName}_lorebook.json`, data);
      showToast(`'${data.name}' 로어북이 다운로드되었습니다.`, 'success');
      return;
    }

    const deleteCardBtn = e.target.closest('.action-delete-lb');
    if (deleteCardBtn) {
      e.stopPropagation();
      const card = deleteCardBtn.closest('.lorebook-editor-card');
      const title = card.querySelector('.entry-title').textContent.trim();
      showModalConfirm('로어북 항목 삭제 확인', `'${title}' 로어북을 삭제하시겠습니까?`, () => {
        card.remove();
        saveCurrentLorebookDOMToStore();
        showToast(`'${title}' 로어북이 삭제되었습니다.`, 'info');
      });
      return;
    }

    const entryHeaderLeft = e.target.closest('.entry-header-left');
    if (entryHeaderLeft) {
      entryHeaderLeft.closest('.lorebook-editor-card').classList.toggle('collapsed');
      return;
    }
  });

  renderLorebookView();

  // ==========================================
  // 7. TTS 파트 구현 (엔진/모델/API 키/음성 선택/테스트)
  // ==========================================
  const ttsProviderSelect = document.getElementById('ttsProviderSelect');
  const ttsApiKeyGroup = document.getElementById('ttsApiKeyGroup');
  const ttsApiKeyInput = document.getElementById('ttsApiKeyInput');
  const btnToggleApiKey = document.getElementById('btnToggleApiKey');
  const ttsEndpointGroup = document.getElementById('ttsEndpointGroup');
  const ttsEndpointInput = document.getElementById('ttsEndpointInput');
  const ttsModelSelect = document.getElementById('ttsModelSelect');
  const ttsVoiceSelect = document.getElementById('ttsVoiceSelect');
  const ttsRateRange = document.getElementById('ttsRateRange');
  const ttsRateVal = document.getElementById('ttsRateVal');
  const ttsPitchRange = document.getElementById('ttsPitchRange');
  const ttsPitchVal = document.getElementById('ttsPitchVal');
  const ttsAutoPlayCheck = document.getElementById('ttsAutoPlayCheck');
  const btnTestTts = document.getElementById('btnTestTts');
  const btnSaveTts = document.getElementById('btnSaveTts');

  // TTS 설정 상태 객체
  let ttsSettings = {
    provider: 'webspeech',
    apiKey: '',
    endpoint: '',
    model: 'default',
    voice: 'default',
    rate: 1.0,
    pitch: 1.0,
    autoPlay: false
  };

  // 저장된 TTS 설정 불러오기
  try {
    const savedTts = localStorage.getItem('minori_tts_config');
    if (savedTts) ttsSettings = Object.assign(ttsSettings, JSON.parse(savedTts));
  } catch (e) { console.warn('Failed to load TTS config', e); }

  function applyTtsUiState() {
    if (ttsProviderSelect) ttsProviderSelect.value = ttsSettings.provider;
    if (ttsApiKeyInput) ttsApiKeyInput.value = ttsSettings.apiKey;
    if (ttsEndpointInput) ttsEndpointInput.value = ttsSettings.endpoint;
    if (ttsRateRange) {
      ttsRateRange.value = ttsSettings.rate;
      if (ttsRateVal) ttsRateVal.textContent = `${ttsSettings.rate}x`;
    }
    if (ttsPitchRange) {
      ttsPitchRange.value = ttsSettings.pitch;
      if (ttsPitchVal) ttsPitchVal.textContent = `${ttsSettings.pitch}`;
    }
    if (ttsAutoPlayCheck) ttsAutoPlayCheck.checked = !!ttsSettings.autoPlay;

    handleTtsProviderChange();
  }

  function handleTtsProviderChange() {
    const provider = ttsProviderSelect ? ttsProviderSelect.value : 'webspeech';
    ttsSettings.provider = provider;

    if (ttsApiKeyGroup) ttsApiKeyGroup.style.display = (provider === 'webspeech') ? 'none' : 'flex';
    if (ttsEndpointGroup) ttsEndpointGroup.style.display = (provider === 'custom') ? 'flex' : 'none';

    // 모델 옵션 갱신
    if (ttsModelSelect) {
      ttsModelSelect.innerHTML = '';
      if (provider === 'openai') {
        ttsModelSelect.innerHTML = `
          <option value="tts-1" selected>OpenAI: tts-1 (표준 고속)</option>
          <option value="tts-1-hd">OpenAI: tts-1-hd (고음질)</option>
        `;
      } else if (provider === 'elevenlabs') {
        ttsModelSelect.innerHTML = `
          <option value="eleven_multilingual_v2" selected>ElevenLabs: Multilingual v2</option>
          <option value="eleven_turbo_v2">ElevenLabs: Turbo v2</option>
          <option value="eleven_monolingual_v1">ElevenLabs: English v1</option>
        `;
      } else if (provider === 'google') {
        ttsModelSelect.innerHTML = `
          <option value="ko-KR-Neural2-A" selected>Google: ko-KR-Neural2-A (여성)</option>
          <option value="ko-KR-Neural2-C">Google: ko-KR-Neural2-C (남성)</option>
          <option value="ko-KR-Standard-A">Google: ko-KR-Standard-A</option>
        `;
      } else {
        ttsModelSelect.innerHTML = `<option value="default" selected>기본 모델 (Default)</option>`;
      }
      if (ttsSettings.model) ttsModelSelect.value = ttsSettings.model;
    }

    loadTtsVoices();
  }

  function loadTtsVoices() {
    if (!ttsVoiceSelect) return;
    const provider = ttsProviderSelect ? ttsProviderSelect.value : 'webspeech';

    if (provider === 'openai') {
      ttsVoiceSelect.innerHTML = `
        <option value="nova" selected>Nova (차분하고 발랄한 여성)</option>
        <option value="alloy">Alloy (중성적)</option>
        <option value="echo">Echo (차분한 남성)</option>
        <option value="fable">Fable (영국풍)</option>
        <option value="onyx">Onyx (깊은 남성)</option>
        <option value="shimmer">Shimmer (맑은 여성)</option>
      `;
      if (ttsSettings.voice) ttsVoiceSelect.value = ttsSettings.voice;
      return;
    }

    if (provider === 'elevenlabs') {
      ttsVoiceSelect.innerHTML = `
        <option value="21m00Tcm4TlvDq8ikWAM" selected>Rachel (차분한 비서)</option>
        <option value="AZnzlk1XvdvUeBnXmlld">Domi (강인한 톤)</option>
        <option value="EXAVITQu4vr4xnSDxMaL">Bella (상냥한 톤)</option>
      `;
      if (ttsSettings.voice) ttsVoiceSelect.value = ttsSettings.voice;
      return;
    }

    // Web Speech API 브라우저 보이스 로드
    if ('speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      ttsVoiceSelect.innerHTML = '';
      if (voices.length === 0) {
        ttsVoiceSelect.innerHTML = `<option value="default">시스템 기본 한국어 음성</option>`;
      } else {
        // 한국어 우선 정렬
        const sorted = voices.slice().sort((a, b) => {
          const aKo = a.lang.includes('ko') ? -1 : 1;
          const bKo = b.lang.includes('ko') ? -1 : 1;
          return aKo - bKo;
        });
        sorted.forEach(v => {
          const opt = document.createElement('option');
          opt.value = v.name;
          opt.textContent = `${v.name} (${v.lang})${v.default ? ' [기본]' : ''}`;
          ttsVoiceSelect.appendChild(opt);
        });
      }
      if (ttsSettings.voice && ttsVoiceSelect.querySelector(`option[value="${ttsSettings.voice}"]`)) {
        ttsVoiceSelect.value = ttsSettings.voice;
      }
    } else {
      ttsVoiceSelect.innerHTML = `<option value="default">브라우저 Web Speech 미지원</option>`;
    }
  }

  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = loadTtsVoices;
  }

  if (ttsProviderSelect) ttsProviderSelect.addEventListener('change', handleTtsProviderChange);

  if (btnToggleApiKey && ttsApiKeyInput) {
    btnToggleApiKey.addEventListener('click', () => {
      const isPwd = ttsApiKeyInput.type === 'password';
      ttsApiKeyInput.type = isPwd ? 'text' : 'password';
      btnToggleApiKey.innerHTML = isPwd
        ? '<svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>'
        : '<svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>';
    });
  }

  if (ttsRateRange && ttsRateVal) {
    ttsRateRange.addEventListener('input', () => {
      ttsRateVal.textContent = `${Number(ttsRateRange.value).toFixed(1)}x`;
    });
  }

  if (ttsPitchRange && ttsPitchVal) {
    ttsPitchRange.addEventListener('input', () => {
      ttsPitchVal.textContent = Number(ttsPitchRange.value).toFixed(1);
    });
  }

  // TTS 설정 저장
  if (btnSaveTts) {
    btnSaveTts.addEventListener('click', () => {
      ttsSettings.provider = ttsProviderSelect.value;
      ttsSettings.apiKey = ttsApiKeyInput.value.trim();
      ttsSettings.endpoint = ttsEndpointInput.value.trim();
      ttsSettings.model = ttsModelSelect.value;
      ttsSettings.voice = ttsVoiceSelect.value;
      ttsSettings.rate = Number(ttsRateRange.value);
      ttsSettings.pitch = Number(ttsPitchRange.value);
      ttsSettings.autoPlay = ttsAutoPlayCheck.checked;

      localStorage.setItem('minori_tts_config', JSON.stringify(ttsSettings));
      showToast('TTS 음성 설정이 저장되었습니다.', 'success');
    });
  }

  // TTS 발화 함수
  function speakMessage(text) {
    if (!text || !('speechSynthesis' in window)) return;
    const cleanText = text.replace(/<[^>]*>?/gm, '').replace(/\[White Thought[\s\S]*?\]/g, '').trim();
    if (!cleanText) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = Number(ttsRateRange ? ttsRateRange.value : 1.0);
    utterance.pitch = Number(ttsPitchRange ? ttsPitchRange.value : 1.0);

    const selectedVoiceName = ttsVoiceSelect ? ttsVoiceSelect.value : null;
    if (selectedVoiceName && selectedVoiceName !== 'default') {
      const voices = window.speechSynthesis.getVoices();
      const v = voices.find(item => item.name === selectedVoiceName);
      if (v) utterance.voice = v;
    }
    window.speechSynthesis.speak(utterance);
  }

  if (btnTestTts) {
    btnTestTts.addEventListener('click', () => {
      speakMessage('안녕하세요, 주인님. MINORI 디지털 비서 시스템 음성 테스트입니다.');
    });
  }

  applyTtsUiState();

  // ==========================================
  // 8. 정규식 스크립트 및 트리거 스크립트 엔진
  // ==========================================
  const tabScriptRegex = document.getElementById('tabScriptRegex');
  const tabScriptTrigger = document.getElementById('tabScriptTrigger');
  const scriptRegexView = document.getElementById('scriptRegexView');
  const scriptTriggerView = document.getElementById('scriptTriggerView');

  if (tabScriptRegex && tabScriptTrigger) {
    tabScriptRegex.addEventListener('click', () => {
      tabScriptRegex.classList.add('active');
      tabScriptTrigger.classList.remove('active');
      scriptRegexView.style.display = 'flex';
      scriptTriggerView.style.display = 'none';
    });

    tabScriptTrigger.addEventListener('click', () => {
      tabScriptTrigger.classList.add('active');
      tabScriptRegex.classList.remove('active');
      scriptRegexView.style.display = 'none';
      scriptTriggerView.style.display = 'flex';
    });
  }

  // 초기 정규식 스크립트 리스트 (4가지 옵션 & @@emo 지원)
  let regexScripts = [
    {
      id: 'reg_emo',
      name: '감정 태그 추출기',
      placement: 'output', // 'input' | 'output' | 'request' | 'display'
      in: '\\[(기쁨|슬픔|화남|미소|생각중|놀람)\\]',
      out: '@@emo $1',
      active: true
    },
    {
      id: 'reg_display_accent',
      name: '미노리 호출 강조',
      placement: 'display',
      in: '(미노리)',
      out: '✨$1',
      active: true
    }
  ];

  // 초기 트리거 스크립트 리스트
  let triggerScripts = [
    {
      id: 'trig_greeting',
      triggerName: 'Greeting',
      type: 'manual', // 'manual' | 'on_send' | 'on_receive'
      actionType: 'insert_message', // 'insert_message' | 'set_emotion' | 'toast_alert' | 'custom_js'
      actionValue: '주인님, 무엇을 도와드릴까요? 명령을 기다리고 있습니다.',
      active: true
    },
    {
      id: 'trig_smile',
      triggerName: 'Smile',
      type: 'manual',
      actionType: 'set_emotion',
      actionValue: '기쁨',
      active: true
    }
  ];

  // 로컬 스토리지 보존 불러오기
  try {
    const savedReg = localStorage.getItem('minori_regex_scripts');
    if (savedReg) regexScripts = JSON.parse(savedReg);
    const savedTrig = localStorage.getItem('minori_trigger_scripts');
    if (savedTrig) triggerScripts = JSON.parse(savedTrig);
  } catch (e) { console.warn(e); }

  function saveScriptsToStorage() {
    localStorage.setItem('minori_regex_scripts', JSON.stringify(regexScripts));
    localStorage.setItem('minori_trigger_scripts', JSON.stringify(triggerScripts));
  }

  // ----------------------------------------------------
  // 정규식 실행 엔진: IN 매칭 텍스트를 OUT으로 변경
  // 특수 패턴 지원: $$, $&, $`, $1~$9, $(name), @@emo
  // ----------------------------------------------------
  function applyCustomRegex(text, inPattern, outPattern) {
    if (!text || !inPattern) return text;
    try {
      const regex = new RegExp(inPattern, 'g');

      // OUT이 @@로 시작 시, 문자열을 교체하지 않고 특수한 효과 적용
      if (outPattern.trim().startsWith('@@')) {
        const match = text.match(regex);
        if (match) {
          const trimmedOut = outPattern.trim();
          if (trimmedOut.startsWith('@@emo')) {
            // @@emo (emotion name)
            const emoName = trimmedOut.replace(/^@@emo\s*/, '').trim();
            // $1 등 매칭 그룹 치환 지원
            const evaluatedEmoName = emoName.replace(/\$1/g, match[1] || '').trim();
            setEmotion(evaluatedEmoName || '기쁨');
          }
          // 문자열은 변경하지 않고 유지
          return text;
        }
        return text;
      }

      // 일반 치환 ($$, $&, $`, $1~$9, $(name))
      return text.replace(regex, (match, ...args) => {
        const namedGroups = (typeof args[args.length - 1] === 'object' && args[args.length - 1] !== null) ? args[args.length - 1] : {};
        const fullString = (typeof args[args.length - 1] === 'object') ? args[args.length - 2] : args[args.length - 1];
        const offset = (typeof args[args.length - 1] === 'object') ? args[args.length - 3] : args[args.length - 2];
        const captures = args.slice(0, (typeof args[args.length - 1] === 'object') ? args.length - 3 : args.length - 2);

        let res = outPattern;
        // $(name)
        res = res.replace(/\$\(([a-zA-Z0-9_]+)\)/g, (_, name) => (namedGroups[name] !== undefined ? namedGroups[name] : ''));
        // $`
        res = res.replace(/\$`/g, fullString.slice(0, offset));
        // $&
        res = res.replace(/\$&/g, match);
        // $1, $2, ...
        res = res.replace(/\$([0-9]+)/g, (_, num) => {
          const idx = parseInt(num, 10) - 1;
          return captures[idx] !== undefined ? captures[idx] : '$' + num;
        });
        // $$ -> $
        res = res.replace(/\$\$/g, '$');
        return res;
      });
    } catch (err) {
      console.warn('정규식 처리 중 오류:', err);
      return text;
    }
  }

  // 4가지 옵션에 따른 정규식 파이프라인 적용
  function applyRegexPipeline(text, placementType) {
    let result = text;
    regexScripts.forEach(script => {
      if (script.active && script.placement === placementType && script.in) {
        result = applyCustomRegex(result, script.in, script.out || '');
      }
    });
    return result;
  }

  // ----------------------------------------------------
  // 트리거 스크립트 실행 엔진
  // ----------------------------------------------------
  function executeTrigger(triggerName) {
    const trigger = triggerScripts.find(t => t.triggerName === triggerName && t.active);
    if (!trigger) {
      console.warn(`트리거 '${triggerName}'을 찾을 수 없거나 비활성화되어 있습니다.`);
      return;
    }

    const { actionType, actionValue } = trigger;
    if (actionType === 'insert_message') {
      const chatInput = document.getElementById('chatInput');
      if (chatInput) {
        chatInput.value = actionValue;
        document.getElementById('btnSend').click();
      }
    } else if (actionType === 'set_emotion') {
      setEmotion(actionValue);
    } else if (actionType === 'toast_alert') {
      showToast(`[트리거 알림: ${triggerName}] ${actionValue}`, 'info');
    } else if (actionType === 'custom_js') {
      try {
        const fn = new Function('context', actionValue);
        fn({ triggerName, activeChatId: getActiveChatContext().chatId });
      } catch (err) {
        showToast(`트리거 JS 오류: ${err.message}`, 'error');
      }
    }
  }

  function executeTriggersByTiming(timing) {
    triggerScripts.forEach(t => {
      if (t.active && t.type === timing) {
        executeTrigger(t.triggerName);
      }
    });
  }

  // ----------------------------------------------------
  // 정규식 & 트리거 UI 렌더링
  // ----------------------------------------------------
  const regexScriptList = document.getElementById('regexScriptList');
  const triggerScriptList = document.getElementById('triggerScriptList');

  const placementLabels = {
    input: '입력문 수정',
    output: '출력문 수정',
    request: '리퀘스트 수정',
    display: '디스플레이 수정'
  };

  function renderScriptView() {
    // 1. 정규식 카드 목록 렌더링
    if (regexScriptList) {
      regexScriptList.innerHTML = '';
      regexScripts.forEach((script, idx) => {
        const card = document.createElement('div');
        card.className = 'script-editor-card collapsed';
        card.dataset.active = script.active ? 'true' : 'false';
        card.dataset.scriptId = script.id;

        card.innerHTML = `
          <div class="script-card-header">
            <div class="script-header-left">
              <span class="fold-arrow">▶</span>
              <span class="badge-placement">${placementLabels[script.placement] || '입력문 수정'}</span>
              <span class="script-title">${escapeHtml(script.name)}</span>
            </div>
            <div class="item-actions">
              <button class="icon-btn link-toggle-btn ${script.active ? 'active' : ''}" title="활성/비활성">
                <svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
              </button>
              <button class="icon-btn danger action-delete-reg" title="삭제">
                <svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              </button>
            </div>
          </div>
          <div class="script-collapsible-body">
            <div class="field-group">
              <label class="field-label-sm">이름</label>
              <input type="text" class="dark-input reg-name-input" value="${escapeHtml(script.name)}">
            </div>
            <div class="field-group">
              <label class="field-label-sm">적용 위치 (4가지 옵션)</label>
              <select class="dark-input reg-placement-select">
                <option value="input" ${script.placement === 'input' ? 'selected' : ''}>입력문 수정 (유저의 입력 수정)</option>
                <option value="output" ${script.placement === 'output' ? 'selected' : ''}>출력문 수정 (캐릭터의 출력 수정)</option>
                <option value="request" ${script.placement === 'request' ? 'selected' : ''}>리퀘스트 데이터 수정 (리퀘스트 시 데이터 수정)</option>
                <option value="display" ${script.placement === 'display' ? 'selected' : ''}>디스플레이 수정 (실제 데이터 유지, 화면 표시만 수정)</option>
              </select>
            </div>
            <div class="field-group">
              <label class="field-label-sm">IN (슬래시/플래그 없는 정규식)</label>
              <input type="text" class="dark-input reg-in-input" value="${escapeHtml(script.in)}" placeholder="예: (미노리|비서)">
            </div>
            <div class="field-group">
              <label class="field-label-sm">OUT ($$, $&, $1, @@emo 지원)</label>
              <input type="text" class="dark-input reg-out-input" value="${escapeHtml(script.out)}" placeholder="예: $1 또는 @@emo 기쁨">
            </div>
          </div>
        `;

        // 카드 내부 이벤트 바인딩
        const header = card.querySelector('.script-header-left');
        header.addEventListener('click', () => card.classList.toggle('collapsed'));

        const linkBtn = card.querySelector('.link-toggle-btn');
        linkBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          script.active = !script.active;
          linkBtn.classList.toggle('active', script.active);
          card.dataset.active = script.active ? 'true' : 'false';
          saveScriptsToStorage();
        });

        const delBtn = card.querySelector('.action-delete-reg');
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          showModalConfirm('정규식 삭제 확인', `'${script.name}' 정규식을 삭제하시겠습니까?`, () => {
            regexScripts.splice(idx, 1);
            saveScriptsToStorage();
            renderScriptView();
            showToast(`'${script.name}' 정규식이 삭제되었습니다.`, 'info');
          });
        });

        const nameInput = card.querySelector('.reg-name-input');
        nameInput.addEventListener('input', () => {
          script.name = nameInput.value.trim() || '정규식';
          card.querySelector('.script-title').textContent = script.name;
          saveScriptsToStorage();
        });

        const placementSelect = card.querySelector('.reg-placement-select');
        placementSelect.addEventListener('change', () => {
          script.placement = placementSelect.value;
          card.querySelector('.badge-placement').textContent = placementLabels[script.placement];
          saveScriptsToStorage();
        });

        const inInput = card.querySelector('.reg-in-input');
        inInput.addEventListener('input', () => {
          script.in = inInput.value;
          saveScriptsToStorage();
        });

        const outInput = card.querySelector('.reg-out-input');
        outInput.addEventListener('input', () => {
          script.out = outInput.value;
          saveScriptsToStorage();
        });

        regexScriptList.appendChild(card);
      });
    }

    // 2. 트리거 카드 목록 렌더링
    if (triggerScriptList) {
      triggerScriptList.innerHTML = '';
      triggerScripts.forEach((trig, idx) => {
        const card = document.createElement('div');
        card.className = 'script-editor-card collapsed';
        card.dataset.active = trig.active ? 'true' : 'false';

        card.innerHTML = `
          <div class="script-card-header">
            <div class="script-header-left">
              <span class="fold-arrow">▶</span>
              <span class="badge-placement">${trig.type === 'manual' ? '버튼/수동' : trig.type}</span>
              <span class="script-title">${escapeHtml(trig.triggerName)}</span>
            </div>
            <div class="item-actions">
              <button class="icon-btn btn-test-trigger" title="실행 테스트">
                <svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </button>
              <button class="icon-btn link-toggle-btn ${trig.active ? 'active' : ''}" title="활성/비활성">
                <svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
              </button>
              <button class="icon-btn danger action-delete-trig" title="삭제">
                <svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              </button>
            </div>
          </div>
          <div class="script-collapsible-body">
            <div class="field-group">
              <label class="field-label-sm">트리거 이름 (TriggerName)</label>
              <input type="text" class="dark-input trig-name-input" value="${escapeHtml(trig.triggerName)}">
            </div>
            <div class="field-group">
              <label class="field-label-sm">실행 시점</label>
              <select class="dark-input trig-type-select">
                <option value="manual" ${trig.type === 'manual' ? 'selected' : ''}>버튼 클릭 전용 ({{button::...}} 또는 risu-trigger)</option>
                <option value="on_send" ${trig.type === 'on_send' ? 'selected' : ''}>메시지 전송 시 (입력 직후)</option>
                <option value="on_receive" ${trig.type === 'on_receive' ? 'selected' : ''}>메시지 수신 시 (답변 직후)</option>
              </select>
            </div>
            <div class="field-group">
              <label class="field-label-sm">동작 타입</label>
              <select class="dark-input trig-action-type">
                <option value="insert_message" ${trig.actionType === 'insert_message' ? 'selected' : ''}>메시지 자동 입력 및 전송</option>
                <option value="set_emotion" ${trig.actionType === 'set_emotion' ? 'selected' : ''}>감정 변경 (@@emo)</option>
                <option value="toast_alert" ${trig.actionType === 'toast_alert' ? 'selected' : ''}>시스템 알림창 띄우기</option>
                <option value="custom_js" ${trig.actionType === 'custom_js' ? 'selected' : ''}>자바스크립트 코드 실행</option>
              </select>
            </div>
            <div class="field-group">
              <label class="field-label-sm">동작 값 / 코드</label>
              <textarea class="dark-textarea trig-val-input" rows="3">${escapeHtml(trig.actionValue)}</textarea>
            </div>
          </div>
        `;

        const header = card.querySelector('.script-header-left');
        header.addEventListener('click', () => card.classList.toggle('collapsed'));

        const testBtn = card.querySelector('.btn-test-trigger');
        testBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          executeTrigger(trig.triggerName);
        });

        const linkBtn = card.querySelector('.link-toggle-btn');
        linkBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          trig.active = !trig.active;
          linkBtn.classList.toggle('active', trig.active);
          card.dataset.active = trig.active ? 'true' : 'false';
          saveScriptsToStorage();
        });

        const delBtn = card.querySelector('.action-delete-trig');
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          showModalConfirm('트리거 삭제 확인', `'${trig.triggerName}' 트리거를 삭제하시겠습니까?`, () => {
            triggerScripts.splice(idx, 1);
            saveScriptsToStorage();
            renderScriptView();
            showToast(`'${trig.triggerName}' 트리거가 삭제되었습니다.`, 'info');
          });
        });

        const nameInput = card.querySelector('.trig-name-input');
        nameInput.addEventListener('input', () => {
          trig.triggerName = nameInput.value.trim() || 'Trigger';
          card.querySelector('.script-title').textContent = trig.triggerName;
          saveScriptsToStorage();
        });

        const typeSelect = card.querySelector('.trig-type-select');
        typeSelect.addEventListener('change', () => {
          trig.type = typeSelect.value;
          card.querySelector('.badge-placement').textContent = trig.type === 'manual' ? '버튼/수동' : trig.type;
          saveScriptsToStorage();
        });

        const actionTypeSelect = card.querySelector('.trig-action-type');
        actionTypeSelect.addEventListener('change', () => {
          trig.actionType = actionTypeSelect.value;
          saveScriptsToStorage();
        });

        const valInput = card.querySelector('.trig-val-input');
        valInput.addEventListener('input', () => {
          trig.actionValue = valInput.value;
          saveScriptsToStorage();
        });

        triggerScriptList.appendChild(card);
      });
    }
  }

  // 스크립트 추가/내보내기/불러오기 버튼 핸들러
  const btnAddRegexScript = document.getElementById('btnAddRegexScript');
  if (btnAddRegexScript) {
    btnAddRegexScript.addEventListener('click', () => {
      const newScript = {
        id: `reg_${Date.now()}`,
        name: `새 정규식 ${regexScripts.length + 1}`,
        placement: 'output',
        in: '',
        out: '',
        active: true
      };
      regexScripts.push(newScript);
      saveScriptsToStorage();
      renderScriptView();
      showToast('새 정규식이 추가되었습니다.', 'success');
    });
  }

  const btnExportRegex = document.getElementById('btnExportRegex');
  if (btnExportRegex) {
    btnExportRegex.addEventListener('click', () => {
      downloadJson('minori_regex_scripts.json', regexScripts);
      showToast('정규식 스크립트 목록이 다운로드되었습니다.', 'success');
    });
  }

  const btnImportRegex = document.getElementById('btnImportRegex');
  if (btnImportRegex) {
    btnImportRegex.addEventListener('click', () => {
      readJsonFile((data) => {
        if (Array.isArray(data)) {
          regexScripts = data;
          saveScriptsToStorage();
          renderScriptView();
          showToast('정규식 스크립트 목록을 불러왔습니다.', 'success');
        }
      });
    });
  }

  const btnAddTriggerScript = document.getElementById('btnAddTriggerScript');
  if (btnAddTriggerScript) {
    btnAddTriggerScript.addEventListener('click', () => {
      const newTrig = {
        id: `trig_${Date.now()}`,
        triggerName: `Trigger_${triggerScripts.length + 1}`,
        type: 'manual',
        actionType: 'toast_alert',
        actionValue: '트리거가 정상 실행되었습니다.',
        active: true
      };
      triggerScripts.push(newTrig);
      saveScriptsToStorage();
      renderScriptView();
      showToast('새 트리거가 추가되었습니다.', 'success');
    });
  }

  const btnExportTrigger = document.getElementById('btnExportTrigger');
  if (btnExportTrigger) {
    btnExportTrigger.addEventListener('click', () => {
      downloadJson('minori_trigger_scripts.json', triggerScripts);
      showToast('트리거 스크립트 목록이 다운로드되었습니다.', 'success');
    });
  }

  const btnImportTrigger = document.getElementById('btnImportTrigger');
  if (btnImportTrigger) {
    btnImportTrigger.addEventListener('click', () => {
      readJsonFile((data) => {
        if (Array.isArray(data)) {
          triggerScripts = data;
          saveScriptsToStorage();
          renderScriptView();
          showToast('트리거 스크립트 목록을 불러왔습니다.', 'success');
        }
      });
    });
  }

  // 초기 스크립트 뷰 렌더링
  renderScriptView();

  // ==========================================
  // 9. 작업 공간 경로 저장 상태
  // ==========================================
  const workspacePathInput = document.getElementById('workspacePathInput');
  const workspaceStatusMsg = document.getElementById('workspaceStatusMsg');
  const btnSaveWorkspace = document.getElementById('btnSaveWorkspace');

  if (btnSaveWorkspace && workspacePathInput) {
    btnSaveWorkspace.addEventListener('click', () => {
      const path = workspacePathInput.value.trim();
      const isValid = path.length > 0;
      workspaceStatusMsg.textContent = isValid ? '경로가 유효합니다.' : '경로를 입력해 주세요.';
      workspaceStatusMsg.classList.toggle('invalid', !isValid);
      workspacePathInput.setAttribute('aria-invalid', String(!isValid));
      if (isValid) {
        localStorage.setItem('minoriWorkspacePath', path);
        showToast('작업 공간 경로가 저장되었습니다.', 'success');
      }
    });

    const savedWorkspacePath = localStorage.getItem('minoriWorkspacePath');
    if (savedWorkspacePath) workspacePathInput.value = savedWorkspacePath;
  }

  // 전체 데이터 초기화 버튼
  const btnClearAllData = document.getElementById('btnClearAllData');
  if (btnClearAllData) {
    btnClearAllData.addEventListener('click', () => {
      showModalConfirm('전체 데이터 초기화', '주의: 모든 대화 및 세션, 로어북, 설정을 초기값으로 초기화하시겠습니까? 되돌릴 수 없습니다.', () => {
        localStorage.clear();
        location.reload();
      });
    });
  }

  // ==========================================
  // 10. White Thought 아코디언 토글
  // ==========================================
  document.addEventListener('click', (e) => {
    const thoughtHeader = e.target.closest('.thought-header');
    if (thoughtHeader) {
      const container = thoughtHeader.closest('.thought-container');
      container.classList.toggle('collapsed');
    }
  });

  // ==========================================
  // 11. 메시지 전송 및 정규식/트리거/로어북/TTS 통합 파이프라인
  // ==========================================
  const chatInput = document.getElementById('chatInput');
  const btnSend = document.getElementById('btnSend');

  function sendMessage() {
    let rawText = chatInput.value.trim();
    if (!rawText) return;

    saveCurrentLorebookDOMToStore();

    // 1단계: '입력문 수정' 정규식 파이프라인 적용
    let modifiedUserInput = applyRegexPipeline(rawText, 'input');

    // 2단계: 'on_send' 트리거 스크립트 실행
    executeTriggersByTiming('on_send');

    // 3단계: '리퀘스트 데이터 수정' 정규식 적용 (LLM 요청 페이로드용)
    let requestPayloadText = applyRegexPipeline(modifiedUserInput, 'request');

    const ctx = getActiveChatContext();
    const activeChatId = ctx.chatId;

    // 사용자 메시지 화면 렌더링
    renderMessageToViewport('user', modifiedUserInput, null);
    chatInput.value = '';

    // 로어북 스코프 검사 및 최대 토큰 초과 필터링
    const maxTokensLimit = Number(lorebookStore.config.maxTokens || 1000);
    const appliedLogs = [];
    let currentTotalTokens = 0;

    // [노트 로어북 검사]
    const noteScopeKey = ctx.noteId || 'root_note';
    const noteData = lorebookStore.notes[noteScopeKey] || { folders: [], rootEntries: [] };
    const allNoteEntries = [...(noteData.rootEntries || [])];
    (noteData.folders || []).forEach(f => allNoteEntries.push(...(f.entries || [])));

    allNoteEntries.forEach(entry => {
      if (entry.active === false) return;
      const entryTokens = Math.ceil((entry.prompt || '').length / 2);
      if (entryTokens > maxTokensLimit) {
        appliedLogs.push(`  - [노트: '${entry.name}'] (${entryTokens} 토큰) -> [한도 초과 제외: 설정 한도 ${maxTokensLimit} 토큰 초과]`);
      } else if (currentTotalTokens + entryTokens > maxTokensLimit) {
        appliedLogs.push(`  - [노트: '${entry.name}'] (${entryTokens} 토큰) -> [누적 한도 초과: 누적 한도 ${maxTokensLimit} 토큰 초과]`);
      } else {
        currentTotalTokens += entryTokens;
        appliedLogs.push(`  - [노트: '${entry.name}'] (${entryTokens} 토큰) -> [적용 완료: 노트 전체 적용]`);
      }
    });

    // [채팅 로어북 검사]
    const chatData = lorebookStore.chats[activeChatId] || { folders: [], rootEntries: [] };
    const allChatEntries = [...(chatData.rootEntries || [])];
    (chatData.folders || []).forEach(f => allChatEntries.push(...(f.entries || [])));

    allChatEntries.forEach(entry => {
      if (entry.active === false) return;
      const entryTokens = Math.ceil((entry.prompt || '').length / 2);
      if (entryTokens > maxTokensLimit) {
        appliedLogs.push(`  - [채팅: '${entry.name}'] (${entryTokens} 토큰) -> [한도 초과 제외: 설정 한도 ${maxTokensLimit} 토큰 초과]`);
      } else if (currentTotalTokens + entryTokens > maxTokensLimit) {
        appliedLogs.push(`  - [채팅: '${entry.name}'] (${entryTokens} 토큰) -> [누적 한도 초과: 누적 한도 ${maxTokensLimit} 토큰 초과]`);
      } else {
        currentTotalTokens += entryTokens;
        appliedLogs.push(`  - [채팅: '${entry.name}'] (${entryTokens} 토큰) -> [적용 완료: 해당 대화 전용 적용]`);
      }
    });

    const lorebookReport = appliedLogs.length > 0
      ? `\n[로어북 스코프 및 토큰 검사 (상한: ${maxTokensLimit} 토큰)]\n` + appliedLogs.join('\n') + `\n* 유효 소비 토큰: ${currentTotalTokens} / ${maxTokensLimit} 토큰`
      : `\n[로어북 스코프 검사]\n- 활성 로어북 없음`;

    // 4단계: 실제 백엔드 에이전트 루프 호출 (/api/chat)
    if (statusIndicator) statusIndicator.textContent = '생각 중... (작업 공간 및 도구 탐색)';
    const cyberCore = document.getElementById('cyberCore');
    if (cyberCore) cyberCore.classList.add('thinking');

    (async () => {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: requestPayloadText,
            chat_id: activeChatId,
            lorebook_context: lorebookReport,
            system_rules: typeof getActiveModulePrompts === 'function' ? getActiveModulePrompts() : ''
          })
        });

        if (!response.ok) {
          throw new Error(`서버 응답 오류 (상태 코드: ${response.status})`);
        }

        const data = await response.json();
        const agentReplyRaw = data.reply || '작업이 완료되었습니다, 주인님.';
        const agentThoughts = (data.thoughts ? data.thoughts + '\n\n' : '') + lorebookReport;

        // 5단계: '출력문 수정' 정규식 적용
        let modifiedReply = applyRegexPipeline(agentReplyRaw, 'output');

        // 6단계: 'on_receive' 트리거 스크립트 실행
        executeTriggersByTiming('on_receive');

        renderMessageToViewport('assistant', modifiedReply, agentThoughts);
        saveCurrentChatMessages(activeChatId);
        chatViewport.scrollTop = chatViewport.scrollHeight;

        // 7단계: TTS 자동 재생 체크 시 음성 출력
        if (ttsSettings.autoPlay) {
          speakMessage(modifiedReply);
        }

      } catch (err) {
        console.error('에이전트 통신 오류:', err);
        const errorReply = `미노리 백엔드 연결 실패\n\n백엔드 서버(FastAPI)가 실행 중인지 확인해 주세요.\n- 오류 내용: ${err.message}\n- 사이드바의 [설정] -> [고급 설정]에서 API 키가 올바르게 저장되었는지 확인해 주세요.`;
        const errorThought = `[시스템 통신 오류]\n서버 주소: /api/chat\n오류: ${err.message}\n\nFastAPI 백엔드가 실행 중인지 확인하세요. (예: python -m uvicorn backend.app:app --reload --port 8000)`;
        
        renderMessageToViewport('assistant', errorReply, errorThought);
        saveCurrentChatMessages(activeChatId);
        chatViewport.scrollTop = chatViewport.scrollHeight;
      } finally {
        if (statusIndicator) statusIndicator.textContent = '온라인 · 대기 중';
        if (cyberCore) cyberCore.classList.remove('thinking');
      }
    })();

    saveCurrentChatMessages(activeChatId);
    chatViewport.scrollTop = chatViewport.scrollHeight;
  }

  if (btnSend && chatInput) {
    btnSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // ==========================================
  // 12. AI 모델 & Gemini API 설정 패널 바인딩
  // ==========================================
  const geminiApiKeyInput = document.getElementById('geminiApiKeyInput');
  const btnToggleGeminiKey = document.getElementById('btnToggleGeminiKey');
  const geminiModelSelect = document.getElementById('geminiModelSelect');
  const customModelGroup = document.getElementById('customModelGroup');
  const customModelInput = document.getElementById('customModelInput');
  const geminiTempRange = document.getElementById('geminiTempRange');
  const geminiTempDisplay = document.getElementById('geminiTempDisplay');
  const apiConnectionStatusBox = document.getElementById('apiConnectionStatusBox');
  const btnTestApiConnection = document.getElementById('btnTestApiConnection');
  const btnSaveApiSettings = document.getElementById('btnSaveApiSettings');

  // 백엔드에서 기존 설정 로드
  async function loadBackendApiSettings() {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) return;
      const data = await res.json();
      
      if (geminiApiKeyInput && data.api_key) {
        geminiApiKeyInput.value = data.api_key;
      }
      if (geminiModelSelect && data.model_name) {
        const hasOption = Array.from(geminiModelSelect.options).some(o => o.value === data.model_name);
        if (hasOption) {
          geminiModelSelect.value = data.model_name;
        } else {
          geminiModelSelect.value = 'custom';
          if (customModelGroup) customModelGroup.style.display = 'block';
          if (customModelInput) customModelInput.value = data.model_name;
        }
      }
      if (geminiTempRange && data.temperature !== undefined) {
        geminiTempRange.value = data.temperature;
        if (geminiTempDisplay) geminiTempDisplay.textContent = data.temperature;
      }
    } catch (e) {
      console.warn('백엔드 설정 로드 대기 중 (정적 페이지 모드 또는 서버 미실행):', e.message);
    }
  }

  if (btnToggleGeminiKey && geminiApiKeyInput) {
    btnToggleGeminiKey.addEventListener('click', () => {
      const isPass = geminiApiKeyInput.type === 'password';
      geminiApiKeyInput.type = isPass ? 'text' : 'password';
      btnToggleGeminiKey.innerHTML = isPass
        ? '<svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>'
        : '<svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>';
    });
  }

  if (geminiModelSelect) {
    geminiModelSelect.addEventListener('change', () => {
      if (customModelGroup) {
        customModelGroup.style.display = geminiModelSelect.value === 'custom' ? 'block' : 'none';
      }
    });
  }

  if (geminiTempRange && geminiTempDisplay) {
    geminiTempRange.addEventListener('input', () => {
      geminiTempDisplay.textContent = geminiTempRange.value;
    });
  }

  // 연결 테스트 버튼 핸들러
  if (btnTestApiConnection) {
    btnTestApiConnection.addEventListener('click', async () => {
      const key = geminiApiKeyInput ? geminiApiKeyInput.value.trim() : '';
      let model = geminiModelSelect ? geminiModelSelect.value : 'gemini-2.5-flash';
      if (model === 'custom' && customModelInput) {
        model = customModelInput.value.trim() || 'gemini-2.5-flash';
      }

      if (apiConnectionStatusBox) {
        apiConnectionStatusBox.style.display = 'block';
        apiConnectionStatusBox.style.backgroundColor = '#1e293b';
        apiConnectionStatusBox.style.border = '1px solid #3b82f6';
        apiConnectionStatusBox.style.color = '#93c5fd';
        apiConnectionStatusBox.innerHTML = '<span style="font-weight:700;">[연결 중]</span> <strong>Google Gemini API에 연결하는 중입니다...</strong><br>잠시만 기다려 주세요.';
      }

      try {
        const res = await fetch('/api/test-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: key, model_name: model })
        });
        const result = await res.json();

        if (apiConnectionStatusBox) {
          if (result.status === 'success') {
            apiConnectionStatusBox.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
            apiConnectionStatusBox.style.border = '1px solid #10b981';
            apiConnectionStatusBox.style.color = '#a7f3d0';
            apiConnectionStatusBox.innerHTML = `<span style="font-weight:700; color:#10b981;">[성공]</span> <strong>${result.message}</strong><br>• 모델: <code>${result.model}</code><br>• 응답: <em>"${escapeHtml(result.sample_reply)}"</em>`;
          } else {
            apiConnectionStatusBox.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
            apiConnectionStatusBox.style.border = '1px solid #ef4444';
            apiConnectionStatusBox.style.color = '#fecaca';
            apiConnectionStatusBox.innerHTML = `<span style="font-weight:700; color:#ef4444;">[오류]</span> <strong>${escapeHtml(result.message)}</strong>`;
          }
        }
      } catch (err) {
        if (apiConnectionStatusBox) {
          apiConnectionStatusBox.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
          apiConnectionStatusBox.style.border = '1px solid #ef4444';
          apiConnectionStatusBox.style.color = '#fecaca';
          apiConnectionStatusBox.innerHTML = `<span style="font-weight:700; color:#ef4444;">[연결 실패]</span> <strong>백엔드 서버 연결 실패</strong><br>FastAPI 백엔드가 실행 중인지 확인하세요.<br>오류: ${escapeHtml(err.message)}`;
        }
      }
    });
  }

  // 설정 저장 버튼 핸들러
  if (btnSaveApiSettings) {
    btnSaveApiSettings.addEventListener('click', async () => {
      const key = geminiApiKeyInput ? geminiApiKeyInput.value.trim() : '';
      let model = geminiModelSelect ? geminiModelSelect.value : 'gemini-2.5-flash';
      if (model === 'custom' && customModelInput) {
        model = customModelInput.value.trim() || 'gemini-2.5-flash';
      }
      const temp = geminiTempRange ? parseFloat(geminiTempRange.value) : 0.2;

      try {
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: key,
            model_name: model,
            temperature: temp
          })
        });
        if (res.ok) {
          showToast('API 키 및 모델 설정이 안전하게 저장되었습니다!', 'success');
        } else {
          showToast('설정 저장에 실패했습니다.', 'error');
        }
      } catch (err) {
        showToast('백엔드 통신 오류: ' + err.message, 'error');
      }
    });
  }

  // ==========================================
  // 13. 음성 인식 (STT, Speech-to-Text) 모듈
  // ==========================================
  const btnVoiceInput = document.getElementById('btnVoiceInput');
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  let recognition = null;
  let isListening = false;
  let speechSilenceTimer = null;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = '';

    recognition.onstart = () => {
      isListening = true;
      finalTranscript = '';
      if (btnVoiceInput) {
        btnVoiceInput.classList.add('listening');
        btnVoiceInput.title = '음성 인식 중... (클릭 시 중지)';
      }
      if (statusIndicator) {
        statusIndicator.textContent = '음성 인식 중... 말씀해 주세요';
      }
      const cyberCore = document.getElementById('cyberCore');
      if (cyberCore) cyberCore.classList.add('listening');
    };

    // STT 음향 유사어 오인식 자동 교정 필터
    function correctSttPhonetics(text) {
      if (!text) return '';
      let corrected = text;
      // 1. '미노리' 발음 오인식 대표 패턴 자동 보정
      corrected = corrected.replace(/(며느리|미누리|민오리|미놀이|민우리|미널이|미누리아|며느리야|미누리야|민오리야|미놀이야)/gi, (match) => {
        if (match.endsWith('야')) return '미노리야';
        return '미노리';
      });
      // 2. 사용자가 설정한 인풋 정규식(Input Regex) 파이프라인 실시간 적용
      try {
        if (typeof applyRegexPipeline === 'function') {
          corrected = applyRegexPipeline(corrected, 'input');
        }
      } catch (e) {
        // 무시
      }
      return corrected;
    }

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart + ' ';
        } else {
          interimTranscript += transcriptPart;
        }
      }

      let currentText = (finalTranscript + interimTranscript).trim();
      currentText = correctSttPhonetics(currentText);

      if (chatInput && currentText) {
        chatInput.value = currentText;
        chatInput.scrollTop = chatInput.scrollHeight;
      }

      // 1.5초간 침묵 시 발화 종료로 인식하고 자동 정지 및 전송
      if (speechSilenceTimer) clearTimeout(speechSilenceTimer);
      speechSilenceTimer = setTimeout(() => {
        if (isListening && chatInput && chatInput.value.trim().length > 0) {
          recognition.stop();
        }
      }, 1500);
    };

    recognition.onerror = (event) => {
      console.warn('음성 인식 이벤트 오류:', event.error);
      if (event.error === 'not-allowed') {
        showToast('마이크 접근 권한이 차단되어 있습니다. 브라우저 설정에서 마이크를 허용해 주세요.', 'warn');
      }
      stopVoiceListening();
    };

    recognition.onend = () => {
      stopVoiceListening();

      // 발화 종료 후 텍스트가 채워져 있으면 최종 보정 후 자동 전송 (자비스 대화 루프)
      if (chatInput && chatInput.value.trim().length > 0) {
        chatInput.value = correctSttPhonetics(chatInput.value.trim());
        if (btnSend) btnSend.click();
      }
    };

    function startVoiceListening() {
      try {
        if (speechSilenceTimer) clearTimeout(speechSilenceTimer);
        if (chatInput) chatInput.value = '';
        recognition.start();
      } catch (err) {
        console.error('음성 인식 시작 실패:', err);
      }
    }

    function stopVoiceListening() {
      isListening = false;
      if (speechSilenceTimer) clearTimeout(speechSilenceTimer);
      if (btnVoiceInput) {
        btnVoiceInput.classList.remove('listening');
        btnVoiceInput.title = '음성 인식(STT) 시작/중지';
      }
      if (statusIndicator) {
        statusIndicator.textContent = '온라인 · 대기 중';
      }
      const cyberCore = document.getElementById('cyberCore');
      if (cyberCore) cyberCore.classList.remove('listening');
    }

    if (btnVoiceInput) {
      btnVoiceInput.addEventListener('click', () => {
        if (isListening) {
          recognition.stop();
        } else {
          startVoiceListening();
        }
      });
    }
  } else {
    if (btnVoiceInput) {
      btnVoiceInput.addEventListener('click', () => {
        console.warn('Web Speech API 미지원 환경');
      });
    }
  }

  // ==========================================
  // 14. 모듈 관리 시스템 (설정 탭 내 로어북형 카드 에디터)
  // ==========================================
  const DEFAULT_MODULES = [
    { id: 'mod_search', name: '주도적 파일 탐색', prompt: '필요한 경우 로컬 작업 공간의 파일과 디렉터리를 적극적으로 탐색하고 분석할 것.', enabled: true },
    { id: 'mod_safety', name: '비파괴 저장 원칙', prompt: '기존 파일을 덮어쓰기 전에 사용자에게 확인하거나 백업을 고려하여 안전하게 작업할 것.', enabled: true },
    { id: 'mod_creative', name: '자비스 비서 모드', prompt: '아이언맨의 자비스처럼 정중하고 세련되며 신뢰할 수 있는 비서 어조를 유지할 것.', enabled: true },
    { id: 'mod_summary', name: '핵심 요약 모드', prompt: '답변 시 장황한 서술을 줄이고 핵심 요점과 리스트 위주로 명확히 브리핑할 것.', enabled: false }
  ];

  let customModules = [];
  try {
    const savedMods = localStorage.getItem('minori_modules');
    customModules = savedMods ? JSON.parse(savedMods) : DEFAULT_MODULES;
  } catch (e) {
    customModules = DEFAULT_MODULES;
  }

  function saveModulesToStorage() {
    localStorage.setItem('minori_modules', JSON.stringify(customModules));
    renderSidebarModules();
    renderModulesEditor();
  }

  function getActiveModulePrompts() {
    return customModules
      .filter(m => m.enabled && m.prompt)
      .map(m => `[모듈: ${m.name}] ${m.prompt}`)
      .join('\n');
  }

  // 메인 사이드바 퀵 토글 목록 렌더링
  function renderSidebarModules() {
    const moduleList = document.getElementById('moduleList');
    const moduleCountBadge = document.getElementById('moduleCountBadge');
    if (!moduleList) return;

    if (moduleCountBadge) {
      const activeCount = customModules.filter(m => m.enabled).length;
      moduleCountBadge.textContent = `${activeCount}/${customModules.length}`;
    }

    moduleList.innerHTML = '';
    customModules.forEach((mod) => {
      const row = document.createElement('div');
      row.className = 'module-item-row';
      row.innerHTML = `
        <div class="module-item-left" title="${escapeHtml(mod.prompt || '')}">
          <input type="checkbox" id="mod_quick_${mod.id}" ${mod.enabled ? 'checked' : ''}>
          <label for="mod_quick_${mod.id}" style="cursor: pointer; user-select: none;">${escapeHtml(mod.name)}</label>
        </div>
      `;

      row.querySelector(`#mod_quick_${mod.id}`).addEventListener('change', (e) => {
        mod.enabled = e.target.checked;
        saveModulesToStorage();
      });

      moduleList.appendChild(row);
    });

    // 설정으로 이동 바로가기 버튼 추가
    const goToSettingsBtn = document.createElement('button');
    goToSettingsBtn.className = 'btn-solid-secondary';
    goToSettingsBtn.style.cssText = 'width: 100%; font-size: 11px; justify-content: center; margin-top: 6px; padding: 5px;';
    goToSettingsBtn.innerHTML = '<span>모듈 상세 편집 (설정 ➔)</span>';
    goToSettingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tabSettingsBtn = document.getElementById('tabSettingsBtn');
      if (tabSettingsBtn) tabSettingsBtn.click();
      const modNavBtn = document.querySelector('.nav-icon-btn[data-target="modules"]');
      if (modNavBtn) modNavBtn.click();
    });
    moduleList.appendChild(goToSettingsBtn);
  }

  // [설정 ➔ 모듈 관리] 로어북형 카드 에디터 렌더링
  function renderModulesEditor() {
    const container = document.getElementById('modulesEditorList');
    if (!container) return;
    container.innerHTML = '';

    customModules.forEach((mod, index) => {
      const card = document.createElement('div');
      card.className = 'lorebook-editor-card';
      card.dataset.moduleId = mod.id;

      card.innerHTML = `
        <div class="entry-card-body">
          <div class="entry-header" style="cursor: pointer;">
            <div class="entry-header-left">
              <span class="fold-arrow">▼</span>
              <span class="entry-title">${escapeHtml(mod.name)}</span>
            </div>
            <div class="entry-header-actions" onclick="event.stopPropagation();">
              <button type="button" class="icon-btn action-mod-toggle ${mod.enabled ? 'active' : ''}" title="${mod.enabled ? '활성화됨' : '비활성화됨'}">
                <svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              </button>
              <button type="button" class="icon-btn action-mod-delete danger" title="모듈 삭제">
                <svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              </button>
            </div>
          </div>
          <div class="entry-content-collapsible" style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
            <div class="field-group">
              <label class="field-label-sm">모듈 이름</label>
              <input type="text" class="dark-input mod-name-input" value="${escapeHtml(mod.name)}">
            </div>
            <div class="field-group">
              <label class="field-label-sm">적용할 시스템 규칙 (Prompt Rule)</label>
              <textarea class="dark-textarea mod-prompt-input" rows="3" placeholder="이 모듈이 활성화되었을 때 AI에게 주입할 지침을 입력하세요.">${escapeHtml(mod.prompt || '')}</textarea>
            </div>
          </div>
        </div>
      `;

      // 접기/펼치기
      const header = card.querySelector('.entry-header');
      const content = card.querySelector('.entry-content-collapsible');
      const arrow = card.querySelector('.fold-arrow');
      header.addEventListener('click', () => {
        const isCollapsed = content.style.display === 'none';
        content.style.display = isCollapsed ? 'flex' : 'none';
        arrow.textContent = isCollapsed ? '▼' : '▶';
      });

      // 온/오프 토글 버튼
      const toggleBtn = card.querySelector('.action-mod-toggle');
      toggleBtn.addEventListener('click', () => {
        mod.enabled = !mod.enabled;
        toggleBtn.classList.toggle('active', mod.enabled);
        saveModulesToStorage();
      });

      // 삭제 버튼
      card.querySelector('.action-mod-delete').addEventListener('click', () => {
        customModules.splice(index, 1);
        saveModulesToStorage();
      });

      // 이름 및 프롬프트 실시간 변경 감지
      const nameInput = card.querySelector('.mod-name-input');
      const promptInput = card.querySelector('.mod-prompt-input');
      nameInput.addEventListener('input', () => {
        mod.name = nameInput.value.trim() || '새 모듈';
        card.querySelector('.entry-title').textContent = mod.name;
      });
      promptInput.addEventListener('input', () => {
        mod.prompt = promptInput.value;
      });

      container.appendChild(card);
    });
  }

  // 새 모듈 카드 추가 (설정 탭)
  const btnAddNewModuleCard = document.getElementById('btnAddNewModuleCard');
  if (btnAddNewModuleCard) {
    btnAddNewModuleCard.addEventListener('click', () => {
      const newMod = {
        id: 'mod_' + Date.now(),
        name: '새 규칙 모듈',
        prompt: '이 모듈이 활성화되었을 때 적용할 규칙을 입력하세요.',
        enabled: true
      };
      customModules.push(newMod);
      saveModulesToStorage();
      const container = document.getElementById('modulesEditorList');
      if (container) container.scrollTop = container.scrollHeight;
    });
  }

  // 모듈 저장 버튼 (설정 탭)
  const btnSaveAllModules = document.getElementById('btnSaveAllModules');
  if (btnSaveAllModules) {
    btnSaveAllModules.addEventListener('click', () => {
      const container = document.getElementById('modulesEditorList');
      if (container) {
        const cards = container.querySelectorAll('.lorebook-editor-card');
        cards.forEach(card => {
          const modId = card.dataset.moduleId;
          const mod = customModules.find(m => m.id === modId);
          if (mod) {
            const nameVal = card.querySelector('.mod-name-input');
            const promptVal = card.querySelector('.mod-prompt-input');
            if (nameVal) mod.name = nameVal.value.trim() || '이름 없음';
            if (promptVal) mod.prompt = promptVal.value;
          }
        });
      }
      saveModulesToStorage();
      showToast('모든 모듈 설정이 저장되었습니다.', 'success');
      btnSaveAllModules.innerHTML = '<svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg><span>저장 완료</span>';
      setTimeout(() => {
        btnSaveAllModules.innerHTML = '<svg class="icon-svg-sm" viewBox="0 0 24 24"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg><span>설정 저장</span>';
      }, 1500);
    });
  }

  // 사이드바 모듈 카드 접기/펼치기 토글
  const moduleCard = document.getElementById('moduleCard');
  const moduleCardHeader = document.getElementById('moduleCardHeader');
  if (moduleCardHeader && moduleCard) {
    moduleCardHeader.addEventListener('click', () => {
      moduleCard.classList.toggle('collapsed');
    });
  }

  // 모듈 초기 렌더링
  renderSidebarModules();

  // 초기 설정 로드 실행
  loadBackendApiSettings();
});