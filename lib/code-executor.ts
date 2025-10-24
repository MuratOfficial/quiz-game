import { TestCase, TestResultsJson } from "@/types";

;

export async function executeCode(
  code: string, 
  language: string, 
  testCases: TestCase[]
): Promise<TestResultsJson> {
  const details: TestResultsJson['details'] = [];
  let passed = 0;

  for (const testCase of testCases) {
    try {
      let result = '';
      
      if (language === 'javascript') {
        result = await executeJavaScript(code, testCase.input);
      } else {
        result = 'Language not supported yet';
      }
      
      // Сравниваем результат с ожидаемым выводом
      const testPassed = result.trim() === testCase.expectedOutput.trim();
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
  return new Promise((resolve, reject) => {
    try {
      // Создаем безопасную среду выполнения
      const output = '';
      
      // const customConsole = {
        
      //   log: (...args: any[]) => {
      //     output += args.map(arg => 
      //       typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      //     ).join(' ') + '\n';
      //   }
      // };

      // Оборачиваем код для захвата вывода
      const wrappedCode = `
        (function() {
          ${code}
          
          // Если код определяет функцию, пытаемся ее вызвать
          if (typeof sum === 'function') {
            const inputs = ${JSON.stringify(input.split(',').map(i => i.trim()))};
            const result = sum(...inputs);
            console.log(result);
          }
        })();
      `;

      // Выполняем код
      eval(wrappedCode);
      
      resolve(output.trim());
      /* eslint-disable  @typescript-eslint/no-explicit-any */
    } catch (error: any) {
      reject(error);
    }
  });
}