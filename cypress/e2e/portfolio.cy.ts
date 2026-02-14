describe('Portfolio Site', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should load the page with correct title', () => {
    cy.title().should('contain', 'Yosef Gamble');
  });

  it('should display the header with name and title', () => {
    cy.get('h1').should('contain.text', 'Yosef Gamble');
    cy.get('h2').first().should('contain.text', 'Senior Full-Stack Engineer');
  });

  it('should have navigation links that scroll to sections', () => {
    cy.get('nav[aria-label="In-page jump links"]').within(() => {
      cy.get('a').should('have.length', 3);
      cy.contains('About').should('have.attr', 'href', '#about');
      cy.contains('Experience').should('have.attr', 'href', '#experience');
      cy.contains('Projects').should('have.attr', 'href', '#projects');
    });
  });

  it('should display the About section', () => {
    cy.get('#about').should('be.visible');
    cy.get('#about').should('contain.text', 'Back in 2012');
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

  it('should display the Projects section', () => {
    cy.get('#projects').should('exist');
    cy.get('#projects').should('contain.text', 'Project Alpha');
    cy.get('#projects').should('contain.text', 'Neon UI Kit');
  });

  it('should have social links in the header', () => {
    cy.get('[aria-label="Social media"]').within(() => {
      cy.get('a[aria-label*="GitHub"]')
        .should('have.attr', 'href', 'https://github.com/yegamble')
        .and('have.attr', 'target', '_blank');
      cy.get('a[aria-label*="LinkedIn"]')
        .should('have.attr', 'href', 'https://linkedin.com/in/yosefgamble')
        .and('have.attr', 'target', '_blank');
    });
  });

  it('should display the footer with attribution', () => {
    cy.get('footer').should('contain.text', 'Coded in');
    cy.get('footer').should('contain.text', 'Next.js');
    cy.get('footer').should('contain.text', 'Tailwind CSS');
  });

  it('should navigate to sections via anchor links', () => {
    cy.get('a[href="#experience"]').first().click();
    cy.url().should('include', '#experience');

    cy.get('a[href="#projects"]').first().click();
    cy.url().should('include', '#projects');
  });
});
