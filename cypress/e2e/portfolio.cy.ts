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

  it('should display large name in the hero section', () => {
    cy.get('section').first().within(() => {
      cy.contains('Yosef Gamble').should('be.visible');
      cy.contains('Senior Full-Stack Engineer').should('be.visible');
    });
  });

  it('should show name in navbar after scrolling past hero', () => {
    // Initially the nav name container should be hidden (aria-hidden=true)
    cy.get('header [aria-hidden="true"]').should('exist');

    // Scroll well past the hero section to ensure it is fully out of viewport
    cy.get('#experience').scrollIntoView();

    // After scrolling, the nav name should become visible
    cy.get('header [aria-hidden="false"]', { timeout: 6000 }).should('exist');
    cy.get('header').should('contain.text', 'Yosef Gamble');
  });

  it('should have navigation links in the header', () => {
    cy.get('nav[aria-label="Main navigation"]').within(() => {
      cy.get('a').should('have.length', 3);
      cy.contains('About').should('have.attr', 'href', '#about');
      cy.contains('Experience').should('have.attr', 'href', '#experience');
      cy.contains('Projects').should('have.attr', 'href', '#projects');
    });
  });

  it('should display the hero section with large heading', () => {
    cy.get('h1').should('contain.text', 'NYC based');
    cy.get('h1').should('contain.text', 'pixel-perfect digital experiences');
  });

  it('should display the About section with content', () => {
    cy.get('#about').should('be.visible');
    cy.get('#about').should('contain.text', 'Central Washington University');
    cy.get('#about').should('contain.text', 'realestate.co.nz');
  });

  it('should display the Experience section with all positions', () => {
    cy.get('#experience').should('exist');
    cy.get('#experience').should('contain.text', 'Independent');
    cy.get('#experience').should('contain.text', 'realestate.co.nz');
    cy.get('#experience').should('contain.text', 'ProStock');
  });

  it('should display technology tags in experience entries', () => {
    cy.get('#experience')
      .find('[aria-label="Technologies used"]')
      .should('have.length', 3);
  });

  it('should display the Projects section with card layout', () => {
    cy.get('#projects').should('exist');
    cy.get('#projects').should('contain.text', 'Project Alpha');
    cy.get('#projects').should('contain.text', 'Neon UI Kit');
  });

  it('should have social links in the header', () => {
    cy.get('header').first().within(() => {
      cy.get('a').filter('[href="https://github.com/yegamble"]').should('exist');
      cy.get('a')
        .filter('[href="https://linkedin.com/in/yosefgamble"]')
        .should('exist');
      cy.get('a')
        .filter('[href="mailto:yegamble@gmail.com"]')
        .should('exist');
      cy.get('a')
        .filter('[href="mailto:yosef.gamble@protonmail.com"]')
        .should('exist');
    });
  });

  it('should display the footer with social icons and attribution', () => {
    cy.get('footer').should('contain.text', 'Coded in');
    cy.get('footer').should('contain.text', 'Tailwind CSS');
    cy.get('footer').find('a').should('have.length.at.least', 5);
  });

  it('should navigate to sections via anchor links', () => {
    cy.get('a[href="#experience"]').first().click();
    cy.url().should('include', '#experience');

    cy.get('a[href="#projects"]').first().click();
    cy.url().should('include', '#projects');
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
        cy.get('header').invoke('outerHeight').then((headerHeight) => {
          cy.get('section').first().then(($section) => {
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

        // The name container should not have visible overflow
        cy.get('header [aria-hidden="false"]').should('have.css', 'white-space', 'nowrap');

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
        cy.get('header').invoke('outerHeight').then((navHeight) => {
          cy.get('section p').first().then(($heroName) => {
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
    cy.get('section').first().within(() => {
      cy.get('a[aria-label]').should('have.length.at.least', 1);
    });
  });

  it('should display PGP key button in hero section when env var is set', () => {
    cy.get('section').first().within(() => {
      cy.get('button[aria-label*="PGP"]').should('exist');
    });
  });

  it('should open PGP modal when key icon is clicked', () => {
    cy.get('section').first().within(() => {
      cy.get('button[aria-label*="PGP"]').click();
    });
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('[role="dialog"]').should('contain.text', 'PGP');
  });

  it('should close PGP modal when Escape is pressed', () => {
    cy.get('section').first().within(() => {
      cy.get('button[aria-label*="PGP"]').click();
    });
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('body').type('{esc}');
    cy.get('[role="dialog"]').should('not.exist');
  });

  it('should close PGP modal when close button is clicked', () => {
    cy.get('section').first().within(() => {
      cy.get('button[aria-label*="PGP"]').click();
    });
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('[role="dialog"]').within(() => {
      cy.get('button[aria-label*="lose"]').click();
    });
    cy.get('[role="dialog"]').should('not.exist');
  });

  it('should close PGP modal when backdrop is clicked', () => {
    cy.get('section').first().within(() => {
      cy.get('button[aria-label*="PGP"]').click();
    });
    cy.get('[role="dialog"]').should('be.visible');
    // Click the backdrop (parent of the dialog, outside the dialog panel)
    cy.get('[role="dialog"]').parent().click('topLeft');
    cy.get('[role="dialog"]').should('not.exist');
  });
});
