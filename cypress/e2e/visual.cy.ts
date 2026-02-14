describe('Visual Regression', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
    // Wait for fonts or animations if necessary
    cy.wait(1000);
  });

  it('should match the home page snapshot', () => {
    cy.compareSnapshot('home-page', 0.1); // 0.1 threshold
  });

  it('should match the about section snapshot', () => {
    cy.get('#about').scrollIntoView();
    cy.compareSnapshot('about-section', 0.1);
  });

  it('should match the experience section snapshot', () => {
    cy.get('#experience').scrollIntoView();
    cy.compareSnapshot('experience-section', 0.1);
  });

  it('should match the projects section snapshot', () => {
    cy.get('#projects').scrollIntoView();
    cy.compareSnapshot('projects-section', 0.1);
  });
});
