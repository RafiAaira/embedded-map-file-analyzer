import type { AnalysisResult, Section } from '../types/index';

// Generate a large dataset with 150+ sections for performance testing
function generateLargeMockData(): AnalysisResult {
  const sections: Section[] = [];
  let flashAddr = 0x08000000;
  let ramAddr = 0x20000000;

  const files = ['main.o', 'driver.o', 'startup.o', 'hal.o', 'utils.o', 'sensor.o', 'comm.o', 'protocol.o', 'crypto.o', 'storage.o'];
  const textFunctions = ['init', 'process', 'handler', 'callback', 'update', 'read', 'write', 'parse', 'validate', 'encrypt', 'decrypt', 'send', 'receive', 'configure', 'setup'];
  const rodataTypes = ['const', 'strings', 'table', 'lookup', 'config', 'version'];
  const dataTypes = ['initialized', 'config', 'state', 'cache'];
  const bssTypes = ['buffer', 'heap', 'stack', 'pool'];

  // Generate .text sections (80 sections)
  for (let i = 0; i < 80; i++) {
    const func = textFunctions[i % textFunctions.length];
    const file = files[i % files.length];
    const size = Math.floor(Math.random() * 50000) + 1024; // 1KB to 50KB
    sections.push({
      name: `.text.${func}${i > textFunctions.length ? i : ''}`,
      address: `0x${flashAddr.toString(16).padStart(8, '0')}`,
      size,
      filePath: file,
    });
    flashAddr += size;
  }

  // Generate .rodata sections (30 sections)
  for (let i = 0; i < 30; i++) {
    const type = rodataTypes[i % rodataTypes.length];
    const file = files[i % files.length];
    const size = Math.floor(Math.random() * 20000) + 512; // 512B to 20KB
    sections.push({
      name: `.rodata.${type}${i > rodataTypes.length ? i : ''}`,
      address: `0x${flashAddr.toString(16).padStart(8, '0')}`,
      size,
      filePath: file,
    });
    flashAddr += size;
  }

  // Generate .data sections (20 sections)
  for (let i = 0; i < 20; i++) {
    const type = dataTypes[i % dataTypes.length];
    const file = files[i % files.length];
    const size = Math.floor(Math.random() * 5000) + 256; // 256B to 5KB
    sections.push({
      name: `.data.${type}${i > dataTypes.length ? i : ''}`,
      address: `0x${ramAddr.toString(16).padStart(8, '0')}`,
      size,
      filePath: file,
    });
    ramAddr += size;
  }

  // Generate .bss sections (15 sections)
  for (let i = 0; i < 15; i++) {
    const type = bssTypes[i % bssTypes.length];
    const file = i < 10 ? files[i % files.length] : null;
    const size = Math.floor(Math.random() * 10000) + 512; // 512B to 10KB
    sections.push({
      name: `.bss.${type}${i > bssTypes.length ? i : ''}`,
      address: `0x${ramAddr.toString(16).padStart(8, '0')}`,
      size,
      filePath: file,
    });
    ramAddr += size;
  }

  // Add ARM and init sections
  sections.push(
    { name: '.init_array', address: `0x${flashAddr.toString(16).padStart(8, '0')}`, size: 512, filePath: null },
    { name: '.fini_array', address: `0x${(flashAddr + 512).toString(16).padStart(8, '0')}`, size: 256, filePath: null },
    { name: '.ARM.exidx', address: `0x${(flashAddr + 1024).toString(16).padStart(8, '0')}`, size: 2048, filePath: null },
    { name: '.ARM.extab', address: `0x${(flashAddr + 3072).toString(16).padStart(8, '0')}`, size: 1024, filePath: null },
  );

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
    sections: sections.sort((a, b) => b.size - a.size), // Sort by size descending
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

// Large dataset with 150+ sections for performance testing
export const mockAnalysisResult = generateLargeMockData();
