import { experienceEntries } from '../../src/data/experience';
import { projectEntries } from '../../src/data/projects';

// These specs deliberately assert structure — counts, hrefs, non-empty text —
// rather than the words on the page. A résumé edit or a retranslation is a
// content change, and it must not be able to fail the pipeline that ships it;
// the words themselves are asserted against the translation files in
// __tests__/locales/translation-content.test.ts, where changing them is cheap.
const nonEmptyText = ($el: JQuery<HTMLElement>) => {
  expect($el.text().trim(), $el.prop('tagName')).to.not.be.empty;
};

describe('Portfolio Site', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should load the page with correct title', () => {
    cy.title().should('contain', 'Yosef Gamble');
  });

  it('should display the sticky header with navigation', () => {
    cy.get('header').should('be.visible');
    cy.get('nav[aria-label="Main navigation"]').should('exist');
  });

  it('should display the hero identity block', () => {
    // Name, title and location, each its own paragraph.
    cy.get('header + section p').should('have.length.at.least', 3).each(nonEmptyText);
  });

  it('should show name in navbar after scrolling past hero', () => {
    // Initially the nav name container should be hidden (aria-hidden=true)
    cy.get('header [aria-hidden="true"]').should('exist');

    // Scroll well past the hero section to ensure it is fully out of viewport
    cy.get('#experience').scrollIntoView();

    // After scrolling, the brand link joins the accessibility tree carrying the
    // same name the hero shows.
    cy.get('header a[aria-hidden="false"]', { timeout: 6000 }).should('not.have.attr', 'inert');
    cy.get('header + section p')
      .first()
      .invoke('text')
      .then((heroName) => {
        expect(heroName.trim()).to.not.be.empty;
        // The collapsed brand carries the hero name (plus the job title, once
        // the viewport is wide enough for it).
        cy.get('header a[aria-hidden="false"]').invoke('text').should('contain', heroName.trim());
      });
  });

  it('should have navigation links in the header', () => {
    cy.get('nav[aria-label="Main navigation"]').within(() => {
      cy.get('a').should('have.length', 3).each(nonEmptyText);
      cy.get('a[href="#about"]').should('exist');
      cy.get('a[href="#experience"]').should('exist');
      cy.get('a[href="#projects"]').should('exist');
    });
  });

  it('should carry exactly one non-empty h1', () => {
    cy.get('h1').should('have.length', 1).each(nonEmptyText);
  });

  it('should display the About section with three paragraphs and an employer link', () => {
    cy.get('#about').should('be.visible');
    cy.get('#about p').should('have.length', 3).each(nonEmptyText);
    cy.get('#about a[target="_blank"]')
      .should('have.length', 1)
      .and('have.attr', 'href')
      .and('match', /^https:\/\//);
  });

  it('should display one Experience entry per record in src/data', () => {
    cy.get('#experience ol > li')
      .should('have.length', experienceEntries.length)
      .each(nonEmptyText);
    cy.get('#experience h3').should('have.length', experienceEntries.length).each(nonEmptyText);

    experienceEntries.forEach(({ companyUrl }) => {
      if (companyUrl) {
        cy.get(`#experience a[href="${companyUrl}"]`).should('exist');
      }
    });
  });

  it('should display a technology list per experience entry', () => {
    cy.get('#experience ul[aria-label]')
      .should('have.length', experienceEntries.length)
      .each(($list, index) => {
        expect($list.find('li')).to.have.length(experienceEntries[index].technologies.length);
      });
  });

  it('should display one Projects card per record in src/data', () => {
    cy.get('#projects h3').should('have.length', projectEntries.length).each(nonEmptyText);

    projectEntries.forEach(({ repos }) => {
      repos.forEach(({ url }) => {
        cy.get(`#projects a[href="${url}"]`).should('exist');
      });
    });
  });

  it('should have social links in the header', () => {
    cy.get('header')
      .first()
      .within(() => {
        cy.get('a').filter('[href="https://github.com/yegamble"]').should('exist');
        cy.get('a').filter('[href="https://linkedin.com/in/yosefgamble"]').should('exist');
        cy.get('a').filter('[href="mailto:yegamble@gmail.com"]').should('exist');
        cy.get('a').filter('[href="mailto:yosef.gamble@protonmail.com"]').should('exist');
      });
  });

  it('should display the footer with social icons and attribution', () => {
    cy.get('footer p').should('have.length', 1).each(nonEmptyText);
    cy.get('footer a').should('have.length.at.least', 5);
    // The tools the attribution links to, whatever the sentence around them says.
    cy.get('footer a[href="https://code.visualstudio.com/"]').should('exist');
    cy.get('footer a[href="https://tailwindcss.com/"]').should('exist');
    cy.get('footer a[href="https://fonts.google.com/specimen/Inter"]').should('exist');
  });

  it('should navigate to sections via anchor links', () => {
    cy.get('a[href="#experience"]').first().click();
    cy.url().should('include', '#experience');

    cy.get('a[href="#projects"]').first().click();
    cy.url().should('include', '#projects');
  });
});

describe('Skip link', () => {
  beforeEach(() => {
    cy.visit('/en');
  });

  it('should be the first thing a Tab press can reach', () => {
    // Eight header controls and three hero contact links sit between the top of
    // the document and the content, so the skip link has to come before them.
    cy.get('a[href], button, [tabindex]:not([tabindex="-1"])')
      .first()
      .should('have.attr', 'href', '#main');
  });

  it('should reveal itself on focus and hand focus to the content', () => {
    cy.get('a[href="#main"]').focus().should('be.focused');

    // sr-only clips it to a 1px box; focus has to take it out of that and put
    // it above the sticky header rather than behind it.
    cy.get('a[href="#main"]').then(($link) => {
      const style = getComputedStyle($link[0]);
      expect(style.position).to.eq('fixed');
      expect(style.zIndex).to.eq('60');

      const rect = $link[0].getBoundingClientRect();
      expect(rect.width).to.be.greaterThan(1);
      expect(rect.height).to.be.greaterThan(1);
    });

    cy.get('a[href="#main"]').click();
    cy.location('hash').should('eq', '#main');
    cy.get('main').should('have.attr', 'tabindex', '-1');
    cy.focused().should('have.attr', 'id', 'main');
  });

  it('should draw a themed outline where the jump lands', () => {
    cy.get('a[href="#main"]').focus().click();

    cy.get('main').then(($main) => {
      const style = getComputedStyle($main[0]);
      expect(style.outlineStyle).to.eq('solid');
      expect(style.outlineColor).to.eq('rgb(94, 234, 212)');
    });
  });
});

describe('Project carousel dots', () => {
  it('should give every dot a target big enough to hit on a phone', () => {
    cy.viewport(375, 812);
    cy.visit('/en');

    cy.get('#projects [role="group"] button')
      .should('have.length', 4)
      .each(($dot) => {
        const rect = $dot[0].getBoundingClientRect();
        expect(rect.width).to.be.at.least(24);
        expect(rect.height).to.be.at.least(24);
      });
  });
});

describe('Scroll Header — Responsive Layout', () => {
  const viewports: [string, number, number][] = [
    ['mobile', 375, 812],
    ['tablet', 768, 1024],
    ['desktop', 1280, 900],
  ];

  viewports.forEach(([name, width, height]) => {
    describe(`${name} (${width}x${height})`, () => {
      beforeEach(() => {
        cy.viewport(width, height);
        cy.visit('/');
      });

      it('should center nav links before scroll', () => {
        // The inner flex container should use justify-center before scrolling
        cy.get('header > div').first().should('have.css', 'justify-content', 'center');
      });

      it('should not clip navbar text on initial load', () => {
        // The hero name should be fully below the navbar — no overlap
        cy.get('header')
          .invoke('outerHeight')
          .then((headerHeight) => {
            cy.get('section')
              .first()
              .then(($section) => {
                const sectionTop = $section[0].getBoundingClientRect().top;
                expect(sectionTop).to.be.greaterThan((headerHeight as number) - 1);
              });
          });
      });

      it('should transition navbar to justify-between after scroll', () => {
        cy.get('#experience').scrollIntoView();
        cy.get('header [aria-hidden="false"]', { timeout: 6000 }).should('exist');
        cy.get('header > div').first().should('have.css', 'justify-content', 'space-between');
      });

      it('should not have text overflow or wrapping in navbar after scroll', () => {
        cy.get('#experience').scrollIntoView();
        cy.get('header [aria-hidden="false"]', { timeout: 6000 }).should('exist');

        // The name container should not have visible overflow. aria-hidden lives
        // on the brand link; the animated block inside it is what clips.
        cy.get('header a[aria-hidden="false"] > div').should('have.css', 'white-space', 'nowrap');

        // Each navbar link should be fully visible (not clipped)
        if (width >= 640) {
          cy.get('nav[aria-label="Main navigation"] a').each(($link) => {
            const rect = $link[0].getBoundingClientRect();
            expect(rect.width).to.be.greaterThan(0);
            expect(rect.right).to.be.lessThan(width + 1);
          });
        }
      });

      it('should keep social icons fully visible at all scroll positions', () => {
        // Before scroll
        cy.get('header a[href="https://github.com/yegamble"]')
          .should('be.visible')
          .then(($el) => {
            const rect = $el[0].getBoundingClientRect();
            expect(rect.right).to.be.lessThan(width + 1);
            expect(rect.left).to.be.greaterThan(-1);
          });

        // After scroll
        cy.get('#experience').scrollIntoView();
        cy.get('header [aria-hidden="false"]', { timeout: 6000 }).should('exist');
        cy.get('header a[href="https://github.com/yegamble"]')
          .should('be.visible')
          .then(($el) => {
            const rect = $el[0].getBoundingClientRect();
            expect(rect.right).to.be.lessThan(width + 1);
            expect(rect.left).to.be.greaterThan(-1);
          });
      });

      it('should have opaque header background to prevent text bleed-through', () => {
        // Header must not be transparent — hero text must not show through during scroll
        cy.get('header').should('not.have.css', 'background-color', 'rgba(0, 0, 0, 0)');

        // Scroll partway so hero text would be behind the header
        cy.scrollTo(0, 100);
        cy.wait(100);
        cy.get('header').should('not.have.css', 'background-color', 'rgba(0, 0, 0, 0)');
      });

      it('should have adequate spacing between hero name and navbar', () => {
        cy.get('header')
          .invoke('outerHeight')
          .then((navHeight) => {
            cy.get('section p')
              .first()
              .then(($heroName) => {
                const nameTop = $heroName[0].getBoundingClientRect().top;
                // At least 16px gap between navbar bottom and hero name top
                expect(nameTop - (navHeight as number)).to.be.greaterThan(15);
              });
          });
      });
    });
  });
});

describe('Hero Contact Icons & PGP Modal', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display contact icons in the hero section when env vars are set', () => {
    // Email and secure email icons render as links
    cy.get('section')
      .first()
      .within(() => {
        cy.get('a[aria-label]').should('have.length.at.least', 1);
      });
  });

  it('should display PGP key button in hero section when env var is set', () => {
    cy.get('section')
      .first()
      .within(() => {
        cy.get('button[aria-label*="PGP"]').should('exist');
      });
  });

  it('should open PGP modal when key icon is clicked', () => {
    cy.get('section')
      .first()
      .within(() => {
        cy.get('button[aria-label*="PGP"]').click();
      });
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('[role="dialog"]').should('contain.text', 'PGP');
  });

  it('should close PGP modal when Escape is pressed', () => {
    cy.get('section')
      .first()
      .within(() => {
        cy.get('button[aria-label*="PGP"]').click();
      });
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('body').type('{esc}');
    cy.get('[role="dialog"]').should('not.exist');
  });

  it('should close PGP modal when close button is clicked', () => {
    cy.get('section')
      .first()
      .within(() => {
        cy.get('button[aria-label*="PGP"]').click();
      });
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('[role="dialog"]').within(() => {
      cy.get('button[aria-label*="lose"]').click();
    });
    cy.get('[role="dialog"]').should('not.exist');
  });

  it('should close PGP modal when backdrop is clicked', () => {
    cy.get('section')
      .first()
      .within(() => {
        cy.get('button[aria-label*="PGP"]').click();
      });
    cy.get('[role="dialog"]').should('be.visible');
    // Click the backdrop (parent of the dialog, outside the dialog panel)
    cy.get('[role="dialog"]').parent().click('topLeft');
    cy.get('[role="dialog"]').should('not.exist');
  });
});

describe('Estonian locale', () => {
  it('should serve /et with Estonian document attributes and translated chrome', () => {
    // Plain variables, not aliases: an alias made from a query chain is
    // re-executed against whatever page is loaded when it is read back, which
    // would compare /et with itself.
    let englishHeading = '';
    let englishNavLabel: string | undefined = '';

    cy.visit('/en');
    cy.get('h1')
      .invoke('text')
      .then((text) => {
        englishHeading = text;
      });
    cy.get('header nav')
      .invoke('attr', 'aria-label')
      .then((label) => {
        englishNavLabel = label;
      });

    cy.visit('/et');
    cy.get('html').should('have.attr', 'lang', 'et').and('have.attr', 'dir', 'ltr');
    cy.get('header button[aria-expanded]').should('contain.text', 'ET');

    // Same structure, different words: that is what "the locale routed" means
    // without naming a single Estonian string.
    cy.get('header nav a').should('have.length', 3).each(nonEmptyText);
    cy.get('header nav a[href="#about"]').should('exist');
    cy.get('header nav a[href="#experience"]').should('exist');
    cy.get('header nav a[href="#projects"]').should('exist');

    cy.get('h1')
      .invoke('text')
      .should((estonianHeading) => {
        expect(estonianHeading.trim()).to.not.be.empty;
        expect(estonianHeading).to.not.eq(englishHeading);
      });
    cy.get('header nav')
      .invoke('attr', 'aria-label')
      .should((estonianNavLabel) => {
        expect(estonianNavLabel).to.not.be.undefined;
        expect(estonianNavLabel).to.not.eq(englishNavLabel);
      });
  });

  it('should switch from English to Estonian via the language selector', () => {
    cy.visit('/en');
    cy.get('header button[aria-expanded]').click();
    cy.get('header a[hreflang="et"]').click();
    cy.get('html').should('have.attr', 'lang', 'et');
    cy.location('pathname').should('eq', '/et');
    cy.get('header button[aria-expanded]').should('contain.text', 'ET');
  });
});

describe('Hebrew locale', () => {
  // Which cities each locale lists is asserted against the translation files in
  // __tests__/locales/translation-content.test.ts. What only a browser can
  // answer is whether the page actually lays itself out right-to-left.
  it('should serve /he in RTL with a translated hero', () => {
    cy.visit('/he');
    cy.get('html').should('have.attr', 'lang', 'he').and('have.attr', 'dir', 'rtl');
    cy.get('header + section p').should('have.length.at.least', 3).each(nonEmptyText);
  });

  it('should flip the header logical padding and border to the right in RTL', () => {
    // The social block is separated by `border-s`/`ps-*`. Logical properties
    // are the whole reason the RTL layout works without a mirrored stylesheet,
    // and a physical `border-l` would look identical in English.
    const socialBlock = () => cy.get('header a[href*="github.com"]').parent();

    cy.visit('/en');
    socialBlock().should(($el) => {
      const style = getComputedStyle($el[0]);
      expect(parseFloat(style.paddingLeft), 'ltr padding-left').to.be.greaterThan(0);
      expect(parseFloat(style.paddingRight), 'ltr padding-right').to.eq(0);
      expect(parseFloat(style.borderLeftWidth), 'ltr border-left').to.be.greaterThan(0);
      expect(parseFloat(style.borderRightWidth), 'ltr border-right').to.eq(0);
    });

    cy.visit('/he');
    socialBlock().should(($el) => {
      const style = getComputedStyle($el[0]);
      expect(parseFloat(style.paddingRight), 'rtl padding-right').to.be.greaterThan(0);
      expect(parseFloat(style.paddingLeft), 'rtl padding-left').to.eq(0);
      expect(parseFloat(style.borderRightWidth), 'rtl border-right').to.be.greaterThan(0);
      expect(parseFloat(style.borderLeftWidth), 'rtl border-left').to.eq(0);
    });
  });
});

describe('Locale routing and 404s', () => {
  it('should answer an unknown path under /en with an English 404 that has a title', () => {
    cy.request({ url: '/en/does-not-exist', failOnStatusCode: false })
      .its('status')
      .should('eq', 404);

    cy.visit('/en/does-not-exist', { failOnStatusCode: false });
    cy.get('html').should('have.attr', 'lang', 'en').and('have.attr', 'dir', 'ltr');
    cy.title().should('contain', 'Page Not Found');
    cy.contains('404').should('be.visible');
  });

  it('should answer an unknown path under /he with a right-to-left Hebrew 404', () => {
    cy.visit('/he/does-not-exist', { failOnStatusCode: false });
    cy.get('html').should('have.attr', 'lang', 'he').and('have.attr', 'dir', 'rtl');
    cy.title().should('not.be.empty');
  });

  it('should redirect a locale-less path to the language the browser asks for', () => {
    cy.clearCookies();
    cy.request({
      url: '/',
      headers: { 'Accept-Language': 'he-IL,he;q=0.9,en;q=0.5' },
      followRedirect: false,
    }).then((response) => {
      expect(response.status).to.eq(307);
      expect(response.headers.location).to.eq('/he');
      expect(response.headers.vary).to.contain('Accept-Language');
    });
  });

  it('should send the security headers on the bare-domain redirect too', () => {
    // The proxy answers `/` before next.config's headers() layer runs, and the
    // HSTS preload list probes exactly this response.
    cy.clearCookies();
    cy.request({ url: '/', followRedirect: false }).then((response) => {
      expect(response.status).to.eq(307);
      expect(response.headers).to.have.property('strict-transport-security');
      expect(response.headers['strict-transport-security']).to.contain('preload');
      expect(response.headers['x-content-type-options']).to.eq('nosniff');
      expect(response.headers['x-frame-options']).to.eq('DENY');
      expect(response.headers['referrer-policy']).to.eq('strict-origin-when-cross-origin');
    });
  });

  it('should not set a cookie on a localized HTML response', () => {
    // The cookie records a choice, and a locale in a URL is not one — an /en
    // link must not overwrite a stored `he`, and Set-Cookie would also stop a
    // CDN caching the prerendered page.
    cy.request('/en').then((response) => {
      expect(response.headers).to.not.have.property('set-cookie');
    });
  });

  it('should answer /en from the prerender rather than rendering per request', () => {
    // The locale layout takes its language from the route param instead of a
    // request header precisely so the four locale routes can be built once. A
    // header read creeping back in turns them dynamic, which is invisible in
    // every other test here and expensive in production.
    cy.request('/en').then((response) => {
      const headerValue = (name: string) => {
        const value = response.headers[name];
        return Array.isArray(value) ? value[0] : value;
      };
      const prerender = headerValue('x-nextjs-prerender');
      const cache = headerValue('x-nextjs-cache');

      expect(
        prerender === '1' || cache === 'HIT',
        `x-nextjs-prerender=${prerender ?? 'absent'} x-nextjs-cache=${cache ?? 'absent'}`
      ).to.eq(true);
    });
  });
});
