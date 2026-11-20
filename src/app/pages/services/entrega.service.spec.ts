import { TestBed } from '@angular/core/testing';
import { EntregaService } from './entrega.service';

describe('EntregaService', () => {
  it('se puede crear mediante inyección de dependencias', () => {
    TestBed.configureTestingModule({ providers: [EntregaService] });

    expect(TestBed.inject(EntregaService)).toBeTruthy();
  });
});
