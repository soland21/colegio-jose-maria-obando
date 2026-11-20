import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecuperarPassword } from './recuperar-password';
import { provideRouter } from '@angular/router';
import { routes } from '../../app.routes';

describe('RecuperarPassword', () => {
  let component: RecuperarPassword;
  let fixture: ComponentFixture<RecuperarPassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecuperarPassword],
      providers: [provideRouter(routes)],
    }).compileComponents();

    fixture = TestBed.createComponent(RecuperarPassword);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
