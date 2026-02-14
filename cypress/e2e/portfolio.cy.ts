describe('Portfolio Site', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should load the page with correct title', () => {
    cy.title().should('contain', 'Yosef Gamble');
  });

  it('should display the sticky header with name and title', () => {
    cy.get('header').should('be.visible');
    cy.get('header').should('contain.text', 'Yosef Gamble');
    cy.get('header').should('contain.text', 'Senior Full-Stack Engineer');
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
    cy.get('#about').should('contain.text', 'Back in 2012');
    cy.get('#about').should('contain.text', 'TechCorp');
  });

  it('should display the Experience section with all positions', () => {
    cy.get('#experience').should('exist');
    cy.get('#experience').should('contain.text', 'TechCorp');
    cy.get('#experience').should('contain.text', 'realestate.co.nz');
    cy.get('#experience').should('contain.text', 'Proactiv');
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
