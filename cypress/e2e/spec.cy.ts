describe('Portfolio Spec', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  it('should display the correct title', () => {
    cy.title().should('include', 'Yosef Gamble');
  });

  it('should have key sections', () => {
    cy.get('h1').should('contain', 'NYC based');
    cy.get('#about').should('be.visible');
    cy.get('#experience').should('be.visible');
    cy.get('#projects').should('be.visible');
  });

  it('should navigate to sections', () => {
    // Check navigation links in header
    cy.get('nav a[href="#about"]').click();
    cy.url().should('include', '#about');

    cy.get('nav a[href="#experience"]').click();
    cy.url().should('include', '#experience');

    cy.get('nav a[href="#projects"]').click();
    cy.url().should('include', '#projects');
  });

  it('should have dark mode enabled', () => {
    cy.get('html').should('have.class', 'dark');
  });
});
