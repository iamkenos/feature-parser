@P1
Feature: Feature 1
  As a someone
  I want to do something
  So I can see something happen
  ---
  This feature does has a background but does not have scenario outlines

  Background:
    Given I do something first

  @DEBUG
  Scenario: F1S1: Scenario title 1
    When I do something
    Then I expect something to happen

  @SKIP
  Scenario: F1S2: Scenario title 2
    When I do something else
    Then I expect something to happen