import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeleccionarGrado } from './seleccionar-grado';

describe('SeleccionarGrado', () => {
  let component: SeleccionarGrado;
  let fixture: ComponentFixture<SeleccionarGrado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeleccionarGrado],
    }).compileComponents();

    fixture = TestBed.createComponent(SeleccionarGrado);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
