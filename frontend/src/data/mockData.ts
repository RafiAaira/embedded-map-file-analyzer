import type { AnalysisResult } from '../types/index';

// Realistic mock data representing a typical STM32 firmware project
function generateRealisticMockData(): AnalysisResult {
  return {
    memory: {
      FLASH: {
        origin: '0x08000000',
        length: '0x00100000',
        lengthBytes: 1048576, // 1MB
      },
      RAM: {
        origin: '0x20000000',
        length: '0x00030000',
        lengthBytes: 196608, // 192KB
      },
    },
    sections: [
      // TEXT sections (code in FLASH)
      { name: '.text', address: '0x08000200', size: 124856, filePath: 'main.o' },
      { name: '.text.HAL_Init', address: '0x0801e7a8', size: 48320, filePath: 'stm32f4xx_hal.o' },
      { name: '.text.SystemClock_Config', address: '0x0802a548', size: 32768, filePath: 'system_stm32f4xx.o' },
      { name: '.text.MX_GPIO_Init', address: '0x08032548', size: 18432, filePath: 'gpio.o' },
      { name: '.text.MX_USART2_UART_Init', address: '0x08036d48', size: 12288, filePath: 'usart.o' },
      { name: '.text.HAL_UART_Transmit', address: '0x08039d48', size: 8192, filePath: 'stm32f4xx_hal_uart.o' },
      { name: '.text.HAL_GPIO_WritePin', address: '0x0803bd48', size: 6144, filePath: 'stm32f4xx_hal_gpio.o' },
      { name: '.text.HAL_Delay', address: '0x0803d548', size: 4096, filePath: 'stm32f4xx_hal.o' },
      { name: '.text.Error_Handler', address: '0x0803e548', size: 2048, filePath: 'main.o' },
      { name: '.text.SysTick_Handler', address: '0x0803ed48', size: 1536, filePath: 'stm32f4xx_it.o' },
      { name: '.text.startup', address: '0x0803f348', size: 1024, filePath: 'startup_stm32f407xx.o' },

      // RODATA sections (constants in FLASH)
      { name: '.rodata', address: '0x0803f748', size: 24576, filePath: 'main.o' },
      { name: '.rodata.str1.1', address: '0x08045748', size: 16384, filePath: 'printf.o' },
      { name: '.rodata.const_table', address: '0x08049748', size: 8192, filePath: 'config.o' },
      { name: '.rodata.version_string', address: '0x0804b748', size: 512, filePath: 'version.o' },

      // DATA sections (initialized data in RAM, stored in FLASH)
      { name: '.data', address: '0x20000000', size: 4096, filePath: 'main.o' },
      { name: '.data.SystemCoreClock', address: '0x20001000', size: 2048, filePath: 'system_stm32f4xx.o' },
      { name: '.data.uwTick', address: '0x20001800', size: 1024, filePath: 'stm32f4xx_hal.o' },

      // BSS sections (uninitialized data in RAM)
      { name: '.bss', address: '0x20001c00', size: 32768, filePath: 'main.o' },
      { name: '.bss.uart_buffer', address: '0x20009c00', size: 16384, filePath: 'usart.o' },
      { name: '.bss.adc_buffer', address: '0x2000dc00', size: 8192, filePath: 'adc.o' },
      { name: '.bss.heap', address: '0x2000fc00', size: 65536, filePath: null },
      { name: '.bss.stack', address: '0x2001fc00', size: 16384, filePath: null },

      // Special ARM sections
      { name: '.isr_vector', address: '0x08000000', size: 512, filePath: 'startup_stm32f407xx.o' },
      { name: '.init_array', address: '0x0804b948', size: 256, filePath: null },
      { name: '.fini_array', address: '0x0804ba48', size: 128, filePath: null },
      { name: '.ARM.exidx', address: '0x0804bac8', size: 1024, filePath: null },
      { name: '.ARM.extab', address: '0x0804bec8', size: 512, filePath: null },
      { name: '.ARM.attributes', address: '0x00000000', size: 56, filePath: null },
    ],
  };
}

// Small dataset for quick testing
export const mockAnalysisResultSmall: AnalysisResult = {
  memory: {
    FLASH: {
      origin: '0x08000000',
      length: '0x00100000',
      lengthBytes: 1048576, // 1MB
    },
    RAM: {
      origin: '0x20000000',
      length: '0x00030000',
      lengthBytes: 196608, // 192KB
    },
  },
  sections: [
    { name: '.text.main', address: '0x08000100', size: 245760, filePath: 'main.o' },
    { name: '.text.driver', address: '0x08040000', size: 122880, filePath: 'driver.o' },
    { name: '.text.startup', address: '0x08060000', size: 45056, filePath: 'startup.o' },
    { name: '.text.utils', address: '0x0806b000', size: 32768, filePath: 'utils.o' },
    { name: '.text.hal', address: '0x08073000', size: 12288, filePath: 'hal.o' },
    { name: '.rodata.const', address: '0x08076000', size: 81920, filePath: 'main.o' },
    { name: '.rodata.strings', address: '0x0808a000', size: 40960, filePath: 'driver.o' },
    { name: '.data.initialized', address: '0x20000000', size: 6144, filePath: 'main.o' },
    { name: '.data.config', address: '0x20001800', size: 2048, filePath: 'driver.o' },
    { name: '.bss.buffer', address: '0x20002000', size: 49152, filePath: 'driver.o' },
    { name: '.bss.heap', address: '0x2000e000', size: 16384, filePath: null },
    { name: '.init_array', address: '0x080a0000', size: 512, filePath: null },
    { name: '.fini_array', address: '0x080a0200', size: 256, filePath: null },
    { name: '.ARM.exidx', address: '0x080a0300', size: 2048, filePath: null },
    { name: '.ARM.extab', address: '0x080a0b00', size: 1024, filePath: null },
  ],
};

// Realistic dataset representing a typical STM32 firmware
export const mockAnalysisResult = generateRealisticMockData();
