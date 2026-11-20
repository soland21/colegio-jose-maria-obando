import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeleccionarGrado } from './seleccionar-grado';
import { provideRouter } from '@angular/router';
import { routes } from '../../../app.routes';

describe('SeleccionarGrado', () => {
  let component: SeleccionarGrado;
  let fixture: ComponentFixture<SeleccionarGrado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeleccionarGrado],
      providers: [provideRouter(routes)],
    }).compileComponents();

    fixture = TestBed.createComponent(SeleccionarGrado);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
