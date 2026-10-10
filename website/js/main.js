document.addEventListener('DOMContentLoaded', function () {
  // ===== Mobile Navigation =====
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      const isOpen = navMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // ===== Sticky Nav Background Enhancement on Scroll =====
  const nav = document.querySelector('.main-nav');
  if (nav) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 20) {
        nav.classList.add('nav-scrolled');
      } else {
        nav.classList.remove('nav-scrolled');
      }
    });
  }

  // ===== 表单提交 → 企业微信智能表格 =====
  //
  //   contactForm → POST /api/contact → 《用户留言咨询表》
  //   applyForm   → POST /api/apply   → 《筋膜刀用户报名表》
  //
  // 两个表单共用同一套提交/状态/防重复逻辑；各自用 extra() 补充字段、
  // 用 check() 做提交前的必填校验。
  function bindRemoteForm(opts) {
    const form = document.getElementById(opts.formId);
    if (!form) return;

    const statusEl = document.getElementById(opts.statusId);
    const btn = form.querySelector('button[type="submit"]');

    const setStatus = function (msg, kind) {
      if (!statusEl) return;
      statusEl.textContent = msg || '';
      statusEl.className = 'form-status' + (kind ? ' is-' + kind : '');
    };

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (btn && btn.disabled) return;

      const fd = new FormData(form);
      const get = function (k) {
        return String(fd.get(k) || '').trim();
      };

      const data = {
        name: get('name'),
        phone: get('phone'),
        email: get('email'),
        website: fd.get('website') || '' // 蜜罐：真人不会填
      };
      opts.extra(data, fd, get);

      const problem = opts.check(data);
      if (problem) return setStatus(problem, 'error');

      const btnText = btn ? btn.textContent : '';
      if (btn) {
        btn.disabled = true;
        btn.textContent = '提交中…';
      }
      setStatus('正在提交，请稍候…', 'pending');

      try {
        const res = await fetch(opts.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        let json = {};
        try { json = await res.json(); } catch (_) {}

        if (res.ok && json.ok) {
          setStatus(opts.successMsg, 'success');
          form.reset();
        } else {
          setStatus(json.error || '提交失败，请稍后重试', 'error');
        }
      } catch (_) {
        setStatus('网络异常，请稍后重试，或直接通过下方电话联系我们', 'error');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = btnText;
        }
      }
    });
  }

  bindRemoteForm({
    formId: 'contactForm',
    statusId: 'contactStatus',
    endpoint: '/api/contact',
    successMsg: '提交成功！我们会在 1-2 个工作日内与您联系。',
    extra: function (d, fd, get) {
      d.type = fd.get('type') || '';
      d.message = get('message');
    },
    check: function (d) {
      if (!d.name) return '请填写您的姓名';
      if (!d.phone) return '请填写您的联系电话';
      if (!d.message) return '请填写留言内容';
      return null;
    }
  });

  bindRemoteForm({
    formId: 'applyForm',
    statusId: 'applyStatus',
    endpoint: '/api/apply',
    successMsg: '报名提交成功！工作人员将在 1-2 个工作日内与您联系确认。',
    extra: function (d, fd, get) {
      d.course = fd.get('course') || '';
      d.profession = get('profession');
      d.experience = get('experience');
    },
    check: function (d) {
      if (!d.name) return '请填写您的姓名';
      if (!d.phone) return '请填写您的手机号';
      if (!d.course) return '请选择报名课程';
      return null;
    }
  });

  // ===== Smooth Scroll for Anchor Links =====
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ===== Lazy Load Placeholder Images (Optional) =====
  document.querySelectorAll('img').forEach(img => {
    if (!img.getAttribute('src') || img.getAttribute('src').includes('placeholder')) {
      img.alt = img.alt || '图片占位';
    }
  });
});
