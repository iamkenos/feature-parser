Feature: Feature 2
  As someone else
  I want to do something else
  So I can see something else happen
  ---
  This feature does not have a background but has scenario outlines

  Scenario Outline: F2S1: Scenario title <ITER>
    When I do something else with
      """
      <ARG1>
      """
    Then I expect something else to happen to:
      | Header 1   | Header 2   |
      | H1 Value 1 | H2 Value 1 |

    Examples:
      | ITER | ARG1      |
      | 1    | ARG1 VAL1 |
      | 2    | ARG1 VAL2 |
