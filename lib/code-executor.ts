import { TestCase, TestResultsJson } from "@/types";


export async function executeCode(
  code: string, 
  language: string, 
  testCases: TestCase[]
): Promise<TestResultsJson> {
  const details: TestResultsJson['details'] = [];
  let passed = 0;

  for (const testCase of testCases) {
    try {
      let result;
      
      if (language === 'javascript') {
        result = await executeJavaScript(code, testCase.input);
      } else if (language === 'html-css') {
        result = await executeHTMLCSS(code, testCase.input);
      }
      
      const testPassed = result === testCase.expectedOutput;
      if (testPassed) passed++;
      
      details.push({
        testCaseId: testCase.id,
        input: testCase.isHidden ? '***' : testCase.input,
        expectedOutput: testCase.isHidden ? '***' : testCase.expectedOutput,
        actualOutput: testCase.isHidden && !testPassed ? '***' : (result || ''),
        passed: testPassed,
        isHidden: testCase.isHidden,
      });
      /* eslint-disable  @typescript-eslint/no-explicit-any */
    } catch (error: any) {
      details.push({
        testCaseId: testCase.id,
        input: testCase.isHidden ? '***' : testCase.input,
        expectedOutput: testCase.isHidden ? '***' : testCase.expectedOutput,
        actualOutput: `Error: ${error.message}`,
        passed: false,
        isHidden: testCase.isHidden,
      });
    }
  }

  return {
    passed,
    total: testCases.length,
    details,
  };
}

async function executeJavaScript(code: string, input: string): Promise<string> {
  try {
    // Оборачиваем код в функцию для захвата вывода
    const wrappedCode = `
      let output = "";
      const console = {
        log: (...args) => { output += args.join(' ') + '\\n' }
      };
      ${code}
      // Выполняем входные данные если они есть
      ${input}
      return output;
    `;
    
    const func = new Function(wrappedCode);
    const result = func();
    return String(result || '').trim();
    /* eslint-disable  @typescript-eslint/no-explicit-any */
  } catch (error: any) {
    throw new Error(error.message);
  }
}

async function executeHTMLCSS(code: string, input: string): Promise<string> {
  // Заглушка для HTML/CSS выполнения
  return "HTML/CSS execution not implemented";
}