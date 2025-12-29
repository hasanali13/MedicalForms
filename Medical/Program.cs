using Microsoft.EntityFrameworkCore;
using Medical.Data;

var builder = WebApplication.CreateBuilder(args);

// DATABASE
builder.Services.AddDbContext<MedicalContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("MedicalContext"),
        sqlServerOptions => {
            sqlServerOptions.EnableRetryOnFailure();
            // Increase command timeout (seconds) to avoid post-login timeout on slow/loaded servers
            sqlServerOptions.CommandTimeout(60);
        }
    )
);

// MVC + Views
builder.Services.AddControllersWithViews();

// SESSION (IMPORTANT)
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
});

var app = builder.Build();

// ERROR HANDLING
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

// MIDDLEWARE PIPELINE
app.UseHttpsRedirection();
app.UseStaticFiles();      // <--- REQUIRED
app.UseRouting();

app.UseSession();          // <--- ENABLE SESSION HERE

app.UseAuthorization();

// ROUTING
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=ViewPublicForms}/{action=Create}/{id?}"
);

// Create database if it doesn't exist
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<MedicalContext>();
        // This will create the database if it doesn't exist
        context.Database.EnsureCreated();
        context.Database.EnsureCreated();
        
        // SELF-HEALING: Add missing columns (Migration workaround)
        try 
        {
            var sql = @"
                IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'IsConfig' AND Object_ID = Object_ID(N'ViewPublicForm'))
                    ALTER TABLE ViewPublicForm ADD IsConfig bit NOT NULL DEFAULT 0;

                IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'FormDataJson' AND Object_ID = Object_ID(N'ViewPublicForm'))
                    ALTER TABLE ViewPublicForm ADD FormDataJson nvarchar(max) NULL;

                IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'FormSchemaJson' AND Object_ID = Object_ID(N'ViewPublicForm'))
                    ALTER TABLE ViewPublicForm ADD FormSchemaJson nvarchar(max) NULL;

                IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'FieldLabelsJson' AND Object_ID = Object_ID(N'ViewPublicForm'))
                    ALTER TABLE ViewPublicForm ADD FieldLabelsJson nvarchar(max) NULL;

                IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'AdditionalFieldsJson' AND Object_ID = Object_ID(N'ViewPublicForm'))
                    ALTER TABLE ViewPublicForm ADD AdditionalFieldsJson nvarchar(max) NULL;
            ";
            context.Database.ExecuteSqlRaw(sql);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Migration warning: {ex.Message}");
        }

        Console.WriteLine("Database created/verified successfully!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database creation failed: {ex.Message}");
    }
}

// RUN APP
app.Run();